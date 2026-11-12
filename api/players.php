<?php
// POST /api/players.php — crée un joueur (un navigateur). Reçoit : rien. Renvoie : player_id.
declare(strict_types=1);
require __DIR__ . '/lib/response.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/validation.php';
require __DIR__ . '/lib/ratelimit.php';

exigerMethode('POST');
limiterIp('players', 30); // tous les visiteurs de la démo partagent la même IP : plafond large
lireCorpsJson([]);

$joueur = nouvelIdentifiant();
db()->prepare('INSERT INTO players (id, created_at) VALUES (?, NOW(3))')->execute([$joueur]);

repondre(200, ['player_id' => $joueur]);
