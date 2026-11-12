<?php
// GET  /api/scores.php — dix meilleurs (pseudo, score) : meilleur score de chaque joueur, le plus ancien d'abord à égalité.
// POST /api/scores.php — enregistre une partie. Reçoit : game_token, pseudo, counts. Renvoie : score, rank.
//      Le score est calculé ici, jamais envoyé par le client. Erreur propre : 422 partie refusée.
declare(strict_types=1);
require __DIR__ . '/lib/response.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/validation.php';
require __DIR__ . '/lib/ratelimit.php';
require __DIR__ . '/lib/jeu.php';

// Meilleure partie de chaque joueur (n = 1)
const MEILLEURES = '
    SELECT player_id, pseudo, score, finished_at,
           ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY score DESC, finished_at ASC) AS n
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
$corps = lireCorpsJson(['game_token', 'pseudo', 'counts']);
$jeton = exigerIdentifiant($corps['game_token']);
$pseudo = validerPseudo($corps['pseudo']); // erreur ici : le jeton reste valable, le joueur corrige
$points = pointsPolluants();
$compteurs = validerCompteurs($corps['counts'], array_keys($points));

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
$duree = (float) $partie['duree'];

// Contrôles : polluants débloqués, durée plausible, pas plus de ramassages que d'apparitions possibles
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
if ($duree < DUREE_MIN || $duree > DUREE_MAX || $total > ramassagesPossibles($duree)) {
    $refus();
}

db()->prepare('UPDATE games SET score = ?, pseudo = ? WHERE token = ?')->execute([$score, $pseudo, $jeton]);

// Rang : 1 + nombre d'autres joueurs dont la meilleure partie passe devant celle-ci
$requete = db()->prepare(
    'SELECT COUNT(*) FROM (' . MEILLEURES . ') m
     WHERE n = 1 AND player_id <> ? AND (score > ? OR (score = ? AND finished_at < ?))'
);
$requete->execute([$joueur, $score, $score, $partie['finished_at']]);
$rang = 1 + (int) $requete->fetchColumn();

repondre(200, ['score' => $score, 'rank' => $rang]);
