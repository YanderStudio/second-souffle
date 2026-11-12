<?php
// Validation des entrées : JSON uniquement, taille limitée, types stricts, champs inconnus refusés.
declare(strict_types=1);

const TAILLE_MAX_CORPS = 2048; // octets

/**
 * Lit le corps JSON de la requête : un objet avec exactement les champs attendus.
 * Sans champ attendu, un corps vide ou {} est accepté.
 */
function lireCorpsJson(array $champs): array
{
    $brut = (string) file_get_contents('php://input', false, null, 0, TAILLE_MAX_CORPS + 1);
    if (strlen($brut) > TAILLE_MAX_CORPS) {
        erreur(400, 'Requête trop volumineuse.');
    }
    if ($champs === [] && trim($brut) === '') {
        return [];
    }
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== 0) {
        erreur(400, 'Format JSON attendu.');
    }
    // Un objet JSON uniquement (pas un tableau ni une valeur seule)
    if (!str_starts_with(ltrim($brut), '{')) {
        erreur(400, 'Objet JSON attendu.');
    }
    try {
        $donnees = json_decode($brut, true, 4, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        erreur(400, 'JSON invalide.');
    }
    $recus = array_keys($donnees);
    sort($recus);
    $attendus = $champs;
    sort($attendus);
    if ($recus !== $attendus) {
        erreur(400, 'Champs invalides.'); // champ manquant ou inconnu
    }
    return $donnees;
}

/** Identifiant de 32 caractères hexadécimaux (player_id, game_token). */
function exigerIdentifiant(mixed $valeur): string
{
    if (!is_string($valeur) || preg_match('/^[0-9a-f]{32}$/', $valeur) !== 1) {
        erreur(400, 'Identifiant invalide.');
    }
    return $valeur;
}

/** Code saisi ou scanné : insensible à la casse, espaces ignorés. */
function normaliserCode(mixed $valeur): string
{
    if (!is_string($valeur) || mb_strlen($valeur) > 30) {
        erreur(400, 'Code invalide.');
    }
    $code = strtoupper((string) preg_replace('/\s+/u', '', $valeur));
    if (preg_match('/^[A-Z0-9]{1,20}$/', $code) !== 1) {
        erreur(404, 'Code inconnu.');
    }
    return $code;
}

/** Pseudo : espaces retirés aux extrémités, 3 à 15 lettres, chiffres, espaces, - ou _, sans mot interdit. */
function validerPseudo(mixed $valeur): string
{
    if (!is_string($valeur)) {
        erreur(400, 'Pseudo invalide.');
    }
    $pseudo = trim($valeur);
    if (preg_match('/^[\p{L}\p{N} _-]{3,15}$/u', $pseudo) !== 1) {
        erreur(400, 'Pseudo invalide : 3 à 15 lettres, chiffres, espaces, - ou _.');
    }
    if (contientMotInterdit($pseudo)) {
        erreur(400, 'Pseudo refusé.');
    }
    return $pseudo;
}

/**
 * Compare le pseudo à la liste de mots interdits, sans accents ni majuscules.
 * Mot court (≤ 5 lettres) : refusé s'il forme un mot entier du pseudo (séparé par espace, - ou _) ;
 * mot long : refusé s'il apparaît n'importe où, séparateurs retirés.
 */
function contientMotInterdit(string $pseudo): bool
{
    $simple = simplifier($pseudo);
    $mots = preg_split('/[ _-]+/', $simple, -1, PREG_SPLIT_NO_EMPTY);
    $colle = implode('', $mots);
    $liste = file(__DIR__ . '/mots-interdits.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($liste as $interdit) {
        $interdit = simplifier(trim($interdit));
        if ($interdit === '' || str_starts_with($interdit, '#')) {
            continue;
        }
        $court = mb_strlen($interdit) <= 5;
        if ($court ? (in_array($interdit, $mots, true) || $colle === $interdit) : str_contains($colle, $interdit)) {
            return true;
        }
    }
    return false;
}

/** Minuscules sans accents (é → e, Œ → oe…). */
function simplifier(string $texte): string
{
    $texte = mb_strtolower($texte, 'UTF-8');
    if (class_exists('Normalizer')) {
        $texte = (string) preg_replace('/\p{Mn}/u', '', Normalizer::normalize($texte, Normalizer::FORM_D));
    } else {
        $texte = strtr($texte, [
            'à' => 'a', 'â' => 'a', 'ä' => 'a', 'á' => 'a', 'ã' => 'a', 'å' => 'a', 'ç' => 'c',
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
            'ñ' => 'n', 'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'ö' => 'o', 'õ' => 'o',
            'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ý' => 'y', 'ÿ' => 'y',
        ]);
    }
    return strtr($texte, ['œ' => 'oe', 'æ' => 'ae', 'ß' => 'ss']);
}

/** Compteurs de ramassage {"p1": 12, ...} : ids connus, entiers positifs ou nuls. */
function validerCompteurs(mixed $valeur, array $idsConnus): array
{
    if (!is_array($valeur)) {
        erreur(400, 'Compteurs invalides.');
    }
    foreach ($valeur as $id => $nombre) {
        if (!in_array($id, $idsConnus, true) || !is_int($nombre) || $nombre < 0 || $nombre > 1000000) {
            erreur(400, 'Compteurs invalides.');
        }
    }
    return $valeur;
}
