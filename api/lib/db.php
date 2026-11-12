<?php
// Accès à la base : configuration, connexion PDO, petites requêtes communes.
// Toutes les requêtes sont préparées ; aucune valeur n'est concaténée dans le SQL.
declare(strict_types=1);

/** Contenu de api/config.php (hors git). */
function config(): array
{
    static $config = null;
    if ($config === null) {
        $fichier = __DIR__ . '/../config.php';
        if (!is_file($fichier)) {
            throw new RuntimeException('api/config.php manquant (copier config.example.php)');
        }
        $config = require $fichier;
    }
    return $config;
}

/** Connexion PDO unique : exceptions activées, vraies requêtes préparées. */
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config()['db'];
        $pdo = new PDO($c['dsn'], $c['utilisateur'], $c['mot_de_passe'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

/** Identifiant aléatoire de 32 caractères hexadécimaux. */
function nouvelIdentifiant(): string
{
    return bin2hex(random_bytes(16));
}

/** Refuse (400) un joueur inconnu du serveur. */
function exigerJoueur(string $joueur): void
{
    $requete = db()->prepare('SELECT 1 FROM players WHERE id = ?');
    $requete->execute([$joueur]);
    if ($requete->fetchColumn() === false) {
        erreur(400, 'Joueur inconnu.');
    }
}

/** Ids des polluants débloqués par le joueur, triés (p1, p2…). */
function debloquesDuJoueur(string $joueur): array
{
    $requete = db()->prepare('SELECT polluant_id FROM unlocks WHERE player_id = ? ORDER BY polluant_id');
    $requete->execute([$joueur]);
    return $requete->fetchAll(PDO::FETCH_COLUMN);
}
