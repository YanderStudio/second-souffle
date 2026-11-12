// Partie en cours : boucle requestAnimationFrame, chute, ramassage, défaite, pause.
// La partie survit aux changements d'écran (scanner, fiche) : l'écran Jeu l'attache
// à un canvas puis la détache, sans la perdre.
import { CONFIG } from './config.js';
import { creerCarton, dessiner, dessinerRail, infosPolluant } from './entities.js';
import { creerSpawner, rythme } from './spawner.js';
import { seTouchent, estSousLeRail } from './collisions.js';
import { play } from '../services/audio.js';

/**
 * options :
 *  - debloques() : ids débloqués, relus à chaque apparition
 *  - surDefaite({ score, compteurs, duree }) : partie perdue
 */
export function creerPartie({ debloques, surDefaite }) {
  // Sans p1 débloqué, la partie ne démarre pas
  if (!debloques().includes('p1')) throw new Error('Partie impossible : p1 non débloqué');
  const avancerSpawner = creerSpawner(debloques);
  const objets = [];
  const compteurs = {};
  let score = 0;
  let tempsJeu = 0; // temps de jeu sans les pauses
  let enPause = false;
  let perdue = false;
  let carton = null;
  let railY = 0;
  let surScore = () => {}; // écouteur fourni par l'écran Jeu

  // Canvas attaché (null quand l'écran Jeu n'est pas affiché)
  let canvas = null;
  let ctx = null;
  let echelle = 1; // pixels du canvas par pixel de maquette
  let hauteur = 874; // hauteur visible, en pixels de maquette
  let idImage = 0;
  let instantPrecedent = 0;

  /** Adapte le canvas à sa taille affichée et à la densité de pixels (plafonnée). */
  function dimensionner() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.dprMax);
    const { clientWidth, clientHeight } = canvas;
    canvas.width = Math.round(clientWidth * dpr);
    canvas.height = Math.round(clientHeight * dpr);
    echelle = (clientWidth / CONFIG.largeur) * dpr;
    hauteur = clientHeight / (clientWidth / CONFIG.largeur);
    railY = hauteur - CONFIG.rail.depuisBas; // rail ancré en bas
    if (!carton) carton = creerCarton(railY);
    carton.y = railY;
    dessinerScene();
  }

  /** Déplace le carton vers x, sans quitter le rail. */
  function placerCarton(x) {
    if (!carton || perdue) return;
    const demi = carton.largeur / 2;
    carton.x = Math.min(Math.max(x, CONFIG.rail.x1 + demi), CONFIG.rail.x2 - demi);
    if (enPause) dessinerScene();
  }

  /** Une étape de jeu de durée dt (s). */
  function mettreAJour(dt) {
    tempsJeu += dt;
    objets.push(...avancerSpawner(dt, tempsJeu));
    const { vitesse } = rythme(tempsJeu);

    for (let i = objets.length - 1; i >= 0; i--) {
      const o = objets[i];
      o.y += vitesse * dt;
      if (seTouchent(o, carton)) {
        if (o.type === 'poisson') return perdre();
        ramasser(o);
        objets.splice(i, 1);
      } else if (o.type === 'polluant' && estSousLeRail(o, railY)) {
        return perdre();
      } else if (o.y - o.hauteur / 2 > hauteur) {
        objets.splice(i, 1); // poisson évité, sorti de l'écran
      }
    }
  }

  function ramasser(polluant) {
    compteurs[polluant.id] = (compteurs[polluant.id] ?? 0) + 1;
    score += infosPolluant(polluant.id).points;
    play('ramassage');
    surScore(score);
  }

  function perdre() {
    perdue = true;
    play('defaite');
    dessinerScene();
    const bilan = { score, compteurs: { ...compteurs }, duree: tempsJeu };
    setTimeout(() => surDefaite(bilan), CONFIG.delaiDefaite * 1000);
  }

  function dessinerScene() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(echelle, 0, 0, echelle, 0, 0);
    dessinerRail(ctx, railY);
    for (const o of objets) dessiner(ctx, o);
    dessiner(ctx, carton);
  }

  function image(instant) {
    const dt = Math.min((instant - instantPrecedent) / 1000, CONFIG.deltaMax);
    instantPrecedent = instant;
    if (!enPause && !perdue) mettreAJour(dt);
    dessinerScene();
    if (!perdue) idImage = requestAnimationFrame(image);
  }

  // Onglet masqué : pause
  function visibilite() {
    if (document.hidden) mettreEnPause();
  }

  function mettreEnPause() {
    enPause = true;
  }

  function reprendre() {
    if (!enPause || perdue) return;
    enPause = false;
  }

  return {
    get score() {
      return score;
    },
    get enPause() {
      return enPause;
    },
    mettreEnPause,
    reprendre,
    placerCarton,

    /** Fonction appelée avec le score à chaque ramassage. */
    ecouterScore(fn) {
      surScore = fn;
    },

    /** Affiche la partie dans ce canvas et lance (ou relance) la boucle. */
    attacher(element) {
      canvas = element;
      ctx = canvas.getContext('2d');
      dimensionner();
      window.addEventListener('resize', dimensionner);
      document.addEventListener('visibilitychange', visibilite);
      instantPrecedent = performance.now();
      idImage = requestAnimationFrame(image);
    },

    /** Arrête la boucle et libère le canvas ; l'état de la partie est conservé. */
    detacher() {
      cancelAnimationFrame(idImage);
      window.removeEventListener('resize', dimensionner);
      document.removeEventListener('visibilitychange', visibilite);
      canvas = null;
      ctx = null;
    },
  };
}
