<?php
// POST /api/unlocks.php — débloque un polluant avec un code.
// Reçoit : player_id, code. Renvoie : polluant_id, unlocked (liste des débloqués).
// Erreurs propres : 404 code inconnu, 409 p1 requis.
declare(strict_types=1);
require __DIR__ . '/lib/response.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/validation.php';
require __DIR__ . '/lib/ratelimit.php';

exigerMethode('POST');
limiterIp('unlocks', 120);
$corps = lireCorpsJson(['player_id', 'code']);
$joueur = exigerIdentifiant($corps['player_id']);
exigerJoueur($joueur);
limiterJoueur('unlocks', $joueur, 5); // cinq essais de code par minute et par joueur

$code = normaliserCode($corps['code']);
$polluant = config()['codes'][$code] ?? null; // les codes ne sont connus que du serveur
if ($polluant === null) {
    erreur(404, 'Code inconnu.');
}

// p1 d'abord ; ensuite l'ordre est libre
if ($polluant !== 'p1' && !in_array('p1', debloquesDuJoueur($joueur), true)) {
    erreur(409, 'Scannez d’abord le premier QR code');
}

// Un code déjà utilisé ne change rien (pas d'erreur)
db()->prepare(
    'INSERT INTO unlocks (player_id, polluant_id, unlocked_at) VALUES (?, ?, NOW(3))
     ON DUPLICATE KEY UPDATE polluant_id = polluant_id'
)->execute([$joueur, $polluant]);

repondre(200, ['polluant_id' => $polluant, 'unlocked' => debloquesDuJoueur($joueur)]);
