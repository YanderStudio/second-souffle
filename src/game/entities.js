// Objets du jeu (polluants, poissons, carton) : création, préchargement des images, dessin
import { CONFIG } from './config.js';
import { polluants } from '../data/polluants.json';

const images = new Map();

/** Charge une image une seule fois ; la promesse se résout quand elle est prête. */
function charger(src) {
  if (images.has(src)) return images.get(src).pret;
  const img = new Image();
  const pret = new Promise((ok, echec) => {
    img.onload = () => ok(img);
    img.onerror = () => echec(new Error(`Image introuvable : ${src}`));
  });
  img.src = src;
  images.set(src, { img, pret });
  return pret;
}

/** Précharge toutes les images de la partie (carton, poisson, cinq polluants). */
export function prechargerImages() {
  const sources = [CONFIG.carton.image, CONFIG.poisson.image, ...polluants.map((p) => p.image)];
  return Promise.all(sources.map(charger));
}

/** Données d'un polluant (points, image) d'après polluants.json. */
export function infosPolluant(id) {
  return polluants.find((p) => p.id === id);
}

/** Crée un polluant centré en x, juste au-dessus de l'écran. */
export function creerPolluant(id, x) {
  const [largeur, hauteur] = CONFIG.taillesPolluants[id];
  return { type: 'polluant', id, x, y: -hauteur / 2, largeur, hauteur, image: infosPolluant(id).image };
}

/** Crée un poisson centré en x, à la même hauteur de départ qu'un polluant donné. */
export function creerPoisson(x, y) {
  const { largeur, hauteur, image } = CONFIG.poisson;
  return { type: 'poisson', x, y, largeur, hauteur, image };
}

/** Crée le carton, posé au centre du rail. */
export function creerCarton(railY) {
  const { largeur, hauteur, image, xDepart } = CONFIG.carton;
  return { x: xDepart, y: railY, largeur, hauteur, image };
}

/** Dessine un objet centré sur (x, y). */
export function dessiner(ctx, objet) {
  const img = images.get(objet.image)?.img;
  if (!img) return;
  ctx.drawImage(img, objet.x - objet.largeur / 2, objet.y - objet.hauteur / 2, objet.largeur, objet.hauteur);
}

/** Dessine le rail orange (sous le voile, comme le reste de la scène). */
export function dessinerRail(ctx, railY) {
  const { x1, x2, epaisseur, couleur } = CONFIG.rail;
  ctx.strokeStyle = couleur;
  ctx.lineWidth = epaisseur;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, railY);
  ctx.lineTo(x2, railY);
  ctx.stroke();
}
