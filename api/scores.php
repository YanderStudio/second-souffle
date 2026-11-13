<?php
// GET  /api/scores.php — dix meilleurs (pseudo, score) : meilleur score de chaque pseudo, le plus ancien d'abord à égalité.
//      Un même pseudo (à l'identique : majuscules et accents comptent) n'apparaît qu'une fois, avec son meilleur score,
//      quel que soit l'appareil ; des pseudos différents d'un même joueur apparaissent chacun.
// POST /api/scores.php — enregistre une partie. Reçoit : game_token, pseudo, counts. Renvoie : score, rank.
//      Le score est calculé ici, jamais envoyé par le client. Erreur propre : 422 partie refusée.
declare(strict_types=1);
require __DIR__ . '/lib/response.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/validation.php';
require __DIR__ . '/lib/ratelimit.php';
require __DIR__ . '/lib/jeu.php';

// Meilleure partie de chaque pseudo (n = 1), pseudos comparés à l'identique (utf8mb4_bin)
const MEILLEURES = '
    SELECT pseudo COLLATE utf8mb4_bin AS pseudo, score, finished_at,
           ROW_NUMBER() OVER (PARTITION BY pseudo COLLATE utf8mb4_bin ORDER BY score DESC, finished_at ASC) AS n
    FROM games WHERE score IS NOT NULL';

if (exigerMethode('GET', 'POST') === 'GET') {
    limiterIp('scores-lecture', 240);
    $lignes = db()->query(
        'SELECT pseudo, score FROM (' . MEILLEURES . ') m WHERE n = 1
         ORDER BY score DESC, finished_at ASC LIMIT 10'
    )->fetchAll();
    $lignes = array_map(fn ($l) => ['pseudo' => $l['pseudo'], 'score' => (int) $l['score']], $lignes);
    repondre(200, ['scores' => $lignes]);
}

limiterIp('scores', 120);
$corps = lireCorpsJson(['game_token', 'pseudo', 'counts', 'duree']);
$jeton = exigerIdentifiant($corps['game_token']);
$pseudo = validerPseudo($corps['pseudo']); // erreur ici : le jeton reste valable, le joueur corrige
$points = pointsPolluants();
$compteurs = validerCompteurs($corps['counts'], array_keys($points));
$dureeJeu = validerDuree($corps['duree']); // temps de jeu hors pauses, annoncé par le jeu

$refus = fn () => erreur(422, 'Partie refusée.');

$requete = db()->prepare('SELECT player_id FROM games WHERE token = ?');
$requete->execute([$jeton]);
$joueur = $requete->fetchColumn();
if ($joueur === false) {
    $refus();
}
limiterJoueur('scores', $joueur, 20);

// Le jeton ne sert qu'une fois : on le « consomme » de façon atomique avant tout contrôle
$consommer = db()->prepare('UPDATE games SET finished_at = NOW(3) WHERE token = ? AND finished_at IS NULL');
$consommer->execute([$jeton]);
if ($consommer->rowCount() !== 1) {
    $refus();
}

$requete = db()->prepare(
    'SELECT finished_at, TIMESTAMPDIFF(MICROSECOND, started_at, finished_at) / 1000000 AS duree FROM games WHERE token = ?'
);
$requete->execute([$jeton]);
$partie = $requete->fetch();
$dureeReelle = (float) $partie['duree']; // mesurée par le serveur, pauses comprises

// Contrôles : polluants débloqués, durées plausibles, pas plus de ramassages que d'apparitions possibles
$debloques = debloquesDuJoueur($joueur);
$total = 0;
$score = 0;
foreach ($compteurs as $id => $nombre) {
    if ($nombre > 0 && !in_array($id, $debloques, true)) {
        $refus();
    }
    $total += $nombre;
    $score += $nombre * $points[$id];
}
// Le temps de jeu annoncé ne peut pas dépasser le temps réellement écoulé depuis le jeton ;
// les pauses (scanner, fiche, téléphone en poche) ne comptent pas, dans la limite de validité du jeton
if ($dureeJeu < DUREE_JEU_MIN
    || $dureeJeu > $dureeReelle + MARGE_HORLOGE
    || $dureeReelle > VALIDITE_JETON
    || $total > ramassagesPossibles($dureeJeu)) {
    $refus();
}

db()->prepare('UPDATE games SET score = ?, pseudo = ? WHERE token = ?')->execute([$score, $pseudo, $jeton]);

// Rang : 1 + nombre d'autres pseudos dont la meilleure partie passe devant celle-ci
$requete = db()->prepare(
    'SELECT COUNT(*) FROM (' . MEILLEURES . ') m
     WHERE n = 1 AND pseudo <> ? AND (score > ? OR (score = ? AND finished_at < ?))'
);
$requete->execute([$pseudo, $score, $score, $partie['finished_at']]);
$rang = 1 + (int) $requete->fetchColumn();

repondre(200, ['score' => $score, 'rank' => $rang]);
