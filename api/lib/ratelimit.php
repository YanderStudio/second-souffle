<?php
// Limitation de débit : compteur par « seau » (route + joueur ou route + IP) et par fenêtre de temps.
declare(strict_types=1);

/** Compte une requête dans le seau ; au-delà de $max sur la fenêtre (s), répond 429. */
function limiter(string $seau, int $max, int $fenetre = 60): void
{
    $debut = intdiv(time(), $fenetre) * $fenetre;
    db()->prepare(
        'INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE count = count + 1'
    )->execute([$seau, $debut]);

    $requete = db()->prepare('SELECT count FROM rate_limits WHERE bucket = ? AND window_start = ?');
    $requete->execute([$seau, $debut]);
    $nombre = (int) $requete->fetchColumn();

    // Ménage de temps en temps : les fenêtres de plus d'un jour ne servent plus
    if (random_int(1, 100) === 1) {
        db()->prepare('DELETE FROM rate_limits WHERE window_start < ?')->execute([time() - 86400]);
    }

    if ($nombre > $max) {
        erreur(429, 'Trop de requêtes, réessayez dans un instant.');
    }
}

/** Plafond par adresse IP sur une route (l'IP est hachée avec un sel : jamais stockée en clair). */
function limiterIp(string $route, int $max): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
    limiter('ip:' . $route . ':' . hash('sha256', config()['sel_ip'] . $ip), $max);
}

/** Plafond par joueur sur une route. */
function limiterJoueur(string $route, string $joueur, int $max): void
{
    limiter('joueur:' . $route . ':' . $joueur, $max);
}
