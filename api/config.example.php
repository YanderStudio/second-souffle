<?php
// Modèle de configuration. Copier en config.php (hors git) et remplir.
// config.php est le SEUL endroit où figurent les codes des QR codes.

return [
    // Connexion MySQL (défaut WampServer : root sans mot de passe)
    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=second_souffle;charset=utf8mb4',
        'utilisateur' => 'root',
        'mot_de_passe' => '',
    ],

    // Codes imprimés sur les QR codes (6 caractères, majuscules) => polluant
    'codes' => [
        'CODE_P1' => 'p1',
        'CODE_P2' => 'p2',
        'CODE_P3' => 'p3',
        'CODE_P4' => 'p4',
        'CODE_P5' => 'p5',
    ],

    // Sel pour anonymiser les adresses IP dans la limitation de débit (texte aléatoire)
    'sel_ip' => 'remplacer-par-un-texte-aleatoire',
];
