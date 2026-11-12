<?php
// Règles du jeu vérifiées par le serveur.
// Points : lus dans src/data/polluants.json, le même fichier que le front.
// Plafonds : reprennent src/game/config.js (à mettre à jour ensemble).
declare(strict_types=1);

// Intervalle minimal entre deux apparitions (= intervalleMin de game/config.js), en secondes
const INTERVALLE_MIN = 0.32;
// Durée de partie acceptée, pauses comprises (mesurée par le serveur entre le jeton et le score)
const DUREE_MIN = 4.0;    // un premier polluant met plus de 4 s à atteindre le rail
const DUREE_MAX = 7200.0; // 2 heures
// Marge sur le nombre d'apparitions possibles
const MARGE_APPARITIONS = 1.2;

/** Points de chaque polluant : ['p1' => 50, ...]. */
function pointsPolluants(): array
{
    static $points = null;
    if ($points === null) {
        $json = file_get_contents(__DIR__ . '/../../src/data/polluants.json');
        $donnees = json_decode((string) $json, true, 8, JSON_THROW_ON_ERROR);
        $points = [];
        foreach ($donnees['polluants'] as $p) {
            $points[$p['id']] = (int) $p['points'];
        }
    }
    return $points;
}

/** Nombre maximal de polluants ramassables sur une durée (s), marge comprise. */
function ramassagesPossibles(float $duree): int
{
    return (int) floor(($duree / INTERVALLE_MIN) * MARGE_APPARITIONS) + 2;
}
