// Collisions : rectangles centrés, réduits pour être un peu plus petits que les images
import { CONFIG } from './config.js';

/** Vrai si les zones de collision de deux objets se chevauchent. */
export function seTouchent(a, b) {
  const r = CONFIG.reductionCollision;
  const ecartX = Math.abs(a.x - b.x);
  const ecartY = Math.abs(a.y - b.y);
  return ecartX < ((a.largeur + b.largeur) * r) / 2 && ecartY < ((a.hauteur + b.hauteur) * r) / 2;
}

/** Vrai si l'objet est entièrement passé sous la ligne du rail. */
export function estSousLeRail(objet, railY) {
  return objet.y - objet.hauteur / 2 > railY;
}
