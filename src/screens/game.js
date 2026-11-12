// Écran Jeu : score en haut à gauche, icônes QR et Pause en haut à droite ;
// rail, carton, polluants et poissons sont dessinés dans le canvas de #scene (sous le voile).
import { creer, image, boutonIcone, auToucher } from './ui.js';
import textes from '../data/textes.json';
import { suivrePointeur } from '../game/input.js';
import '../styles/game.css';

let nettoyer = null;

/**
 * params :
 *  - partie : partie en cours (game/loop.js), conservée entre les écrans
 *  - scanner() : facultatif, appelé par l'icône QR (la partie est déjà en pause)
 *  - accueil() : bouton Accueil du menu pause (la partie est abandonnée, score non enregistré)
 */
export function entrer(racine, { partie, scanner, accueil }) {
  const ecran = creer('section', 'ecran ecran-jeu');
  const score = creer('p', 'jeu-score titre');
  const qr = creer('button', 'jeu-qr');
  qr.type = 'button';
  qr.append(image('/assets/icons/bouton-qr.svg', 'jeu-qr__image', 'Scanner un QR code'));

  const pause = creer('button', 'jeu-pause');
  pause.type = 'button';
  pause.append(image('/assets/icons/bouton-pause.svg', 'jeu-pause__image', 'Mettre en pause'));
  const menu = creerMenuPause(partie, accueil);

  const afficherScore = (s) => {
    score.textContent = `${s} pts`;
  };
  afficherScore(partie.score);
  partie.ecouterScore(afficherScore);

  // L'icône QR ne déplace pas le carton : elle met en pause et ouvre le scanner
  qr.addEventListener('pointerdown', (e) => e.stopPropagation());
  auToucher(qr, () => {
    partie.mettreEnPause();
    scanner?.();
  });

  // L'icône Pause ne déplace pas le carton : elle met en pause et ouvre le menu
  pause.addEventListener('pointerdown', (e) => e.stopPropagation());
  auToucher(pause, () => {
    partie.mettreEnPause();
    menu.ouvrir();
  });

  // Canvas de la scène, sous le voile bleu
  const canvas = creer('canvas', 'jeu-canvas');
  document.getElementById('scene').append(canvas);

  // Glisser : le carton suit le pointeur ; un appui relance une partie en pause
  const retirer = suivrePointeur(ecran, partie.placerCarton, partie.reprendre);

  ecran.append(score, qr, pause, menu.element);
  racine.append(ecran);
  partie.attacher(canvas);

  nettoyer = () => {
    retirer();
    partie.detacher();
    partie.ecouterScore(() => {});
    canvas.remove();
  };
}

export function quitter() {
  nettoyer?.();
  nettoyer = null;
}

/** Menu pause par-dessus le jeu : titre, score, Reprendre et Accueil. */
function creerMenuPause(partie, accueil) {
  const t = textes.pause;
  const element = creer('div', 'jeu-menu');
  element.hidden = true;
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-label', t.titre);
  const score = creer('p', 'jeu-menu__score titre');
  const reprendre = boutonIcone('jeu-menu__reprendre', '/assets/icons/bouton-jouer.svg', t.reprendre);
  const retour = boutonIcone('jeu-menu__accueil', '/assets/icons/bouton-accueil.svg', t.accueil);
  element.append(creer('p', 'jeu-menu__titre titre', t.titre), score, reprendre, retour);

  // Un appui sur le menu ne doit ni reprendre la partie ni déplacer le carton
  element.addEventListener('pointerdown', (e) => e.stopPropagation());
  auToucher(reprendre, () => {
    element.hidden = true;
    partie.reprendre();
  });
  auToucher(retour, () => accueil());

  return {
    element,
    ouvrir() {
      score.textContent = `${partie.score} pts`;
      element.hidden = false;
    },
  };
}
