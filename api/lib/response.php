<?php
// Réponses JSON communes : en-têtes de sécurité, erreurs génériques, contrôle de la méthode HTTP.
declare(strict_types=1);

// Jamais de détail d'erreur envoyé au navigateur
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// Toute erreur PHP devient une exception, toute exception non prévue une réponse 500 générique
set_error_handler(function (int $niveau, string $message, string $fichier, int $ligne): bool {
    throw new ErrorException($message, 0, $niveau, $fichier, $ligne);
});
set_exception_handler(function (Throwable $e): void {
    error_log('[second-souffle] ' . get_class($e) . ' : ' . $e->getMessage()); // journal Apache seulement
    repondre(500, ['erreur' => 'Erreur interne.']);
});

/** Envoie la réponse JSON et arrête le script. */
function repondre(int $statut, array $donnees): void
{
    http_response_code($statut);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

/** Réponse d'erreur avec un message court destiné au joueur. */
function erreur(int $statut, string $message): void
{
    repondre($statut, ['erreur' => $message]);
}

/** Refuse (405) toute méthode HTTP non prévue ; renvoie la méthode utilisée. */
function exigerMethode(string ...$permises): string
{
    $methode = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($methode, $permises, true)) {
        header('Allow: ' . implode(', ', $permises));
        erreur(405, 'Méthode non autorisée.');
    }
    return $methode;
}
