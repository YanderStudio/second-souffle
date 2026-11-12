// Apparitions : polluants débloqués tirés au hasard, poissons de temps en temps.
// Toute situation reste gagnable :
//  - l'écart horizontal entre deux polluants est faisable à la vitesse du carton ;
//  - un poisson apparaît du côté d'un polluant opposé à l'arrivée du carton, à une distance
//    et un peu au-dessus de lui tirées au hasard ; il arrive avant le polluant suivant,
//    qui n'oblige jamais à le traverser.
import { CONFIG } from './config.js';
import { creerPolluant, creerPoisson } from './entities.js';

const entre = (a, b, p) => a + (b - a) * p;
const auHasard = (min, max) => min + Math.random() * (max - min);

/** Vitesse de chute et intervalle d'apparition selon le score (plus de points = plus rapide). */
export function rythme(score) {
  const p = Math.sqrt(Math.min(1, score / CONFIG.scoreVitesseMax));
  return {
    vitesse: entre(CONFIG.vitesseDepart, CONFIG.vitesseMax, p),
    intervalle: entre(CONFIG.intervalleDepart, CONFIG.intervalleMin, p),
  };
}

/** Crée un générateur d'apparitions ; debloques() renvoie la liste à jour des ids débloqués. */
export function creerSpawner(debloques) {
  // Positions possibles du centre d'un polluant : là où le centre du carton peut aller
  const demiCarton = CONFIG.carton.largeur / 2;
  const xMin = CONFIG.rail.x1 + demiCarton;
  const xMax = CONFIG.rail.x2 - demiCarton;

  let minuteur = CONFIG.intervalleDepart / 2; // premier polluant un peu après le départ
  let dernierX = CONFIG.carton.xDepart;
  let precedent = null; // dernier polluant créé (sa position y est mise à jour par la boucle)
  let cotePoisson = 0; // côté du dernier poisson (-1 gauche, 1 droite, 0 aucun)
  let poissonsEnAttente = 0; // poissons tirés mais pas encore placés

  /** Avance le temps ; renvoie les nouveaux objets à ajouter à la scène. */
  return function avancer(dt, score) {
    minuteur -= dt;
    if (minuteur > 0) return [];
    minuteur += rythme(score).intervalle;

    const ids = debloques();
    if (!ids.length) return [];
    const id = ids[Math.floor(Math.random() * ids.length)];

    // Écart faisable avec le polluant précédent (petite marge de sécurité).
    // Les deux tombent toujours à la même vitesse : l'écart vertical entre eux ne change plus.
    // Le temps le plus court entre leurs arrivées = cet écart parcouru à la vitesse maximale
    // (le score peut faire accélérer les objets déjà en chute).
    const yNouveau = -CONFIG.taillesPolluants[id][1] / 2;
    const ecartVertical = precedent ? precedent.y - yNouveau : Infinity;
    const ecartMax = CONFIG.vitesseCartonFaisable * (ecartVertical / CONFIG.vitesseMax) * 0.9;
    let min = Math.max(xMin, dernierX - ecartMax);
    let max = Math.min(xMax, dernierX + ecartMax);
    // Ne pas obliger le carton à traverser le poisson de la rangée précédente
    if (cotePoisson > 0) max = Math.min(max, dernierX);
    if (cotePoisson < 0) min = Math.max(min, dernierX);
    const x = auHasard(min, max);

    const polluant = creerPolluant(id, x);
    const nouveaux = [polluant];
    cotePoisson = 0;

    // Tirage du poisson ; faute de place, il est reporté sur un polluant suivant
    if (Math.random() < CONFIG.probabilitePoisson) poissonsEnAttente++;
    if (poissonsEnAttente > 0) {
      const { vitesse, intervalle } = rythme(score);
      // Hauteur au-dessus du polluant : au plus une fraction de l'écart avec le polluant suivant
      const decalage = auHasard(0, CONFIG.decalagePoissonMax * vitesse * intervalle);
      const poisson = placerPoisson(polluant, dernierX, decalage);
      if (poisson) {
        nouveaux.push(poisson);
        cotePoisson = Math.sign(poisson.x - x);
        poissonsEnAttente--;
      }
    }
    dernierX = x;
    precedent = polluant;
    return nouveaux;
  };
}

/**
 * Place un poisson du côté du polluant opposé à l'arrivée du carton, n'importe où entre
 * l'écart minimal et le bord de l'écran, decalage pixels plus haut ; null si pas de place.
 */
function placerPoisson(polluant, xPrecedent, decalage) {
  const { largeur } = CONFIG.poisson;
  const ecart = (polluant.largeur + largeur) / 2 + CONFIG.margePoisson;
  const bord = CONFIG.largeur - largeur / 2; // centre le plus à droite (le plus à gauche : largeur / 2)

  let cotes;
  if (polluant.x > xPrecedent) cotes = [1];
  else if (polluant.x < xPrecedent) cotes = [-1];
  else cotes = Math.random() < 0.5 ? [1, -1] : [-1, 1];

  for (const cote of cotes) {
    const proche = polluant.x + cote * ecart;
    const loin = cote > 0 ? bord : largeur / 2;
    if ((loin - proche) * cote >= 0) return creerPoisson(auHasard(proche, loin), polluant.y - decalage);
  }
  return null;
}
