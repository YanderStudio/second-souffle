<?php
// POST /api/games.php — commence une partie. Reçoit : player_id. Renvoie : game_token (à usage unique).
// Erreur propre : 403 p1 non débloqué.
declare(strict_types=1);
require __DIR__ . '/lib/response.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/validation.php';
require __DIR__ . '/lib/ratelimit.php';

exigerMethode('POST');
limiterIp('games', 120);
$corps = lireCorpsJson(['player_id']);
$joueur = exigerIdentifiant($corps['player_id']);
exigerJoueur($joueur);
limiterJoueur('games', $joueur, 20);

if (!in_array('p1', debloquesDuJoueur($joueur), true)) {
    erreur(403, 'Scannez d’abord le premier QR code');
}

$jeton = nouvelIdentifiant();
db()->prepare('INSERT INTO games (token, player_id, started_at) VALUES (?, ?, NOW(3))')->execute([$jeton, $joueur]);

repondre(200, ['game_token' => $jeton]);
