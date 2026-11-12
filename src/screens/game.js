// Écran Jeu : score en haut à gauche, icône QR en haut à droite ;
// rail, carton, polluants et poissons sont dessinés dans le canvas de #scene (sous le voile).
import { creer, image, auToucher } from './ui.js';
import { suivrePointeur } from '../game/input.js';
import '../styles/game.css';

let nettoyer = null;

/**
 * params :
 *  - partie : partie en cours (game/loop.js), conservée entre les écrans
 *  - scanner() : facultatif, appelé par l'icône QR (la partie est déjà en pause)
 */
export function entrer(racine, { partie, scanner }) {
  const ecran = creer('section', 'ecran ecran-jeu');
  const score = creer('p', 'jeu-score titre');
  const qr = creer('button', 'jeu-qr');
  qr.type = 'button';
  qr.append(image('/assets/icons/bouton-qr.svg', 'jeu-qr__image', 'Scanner un QR code'));

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

  // Canvas de la scène, sous le voile bleu
  const canvas = creer('canvas', 'jeu-canvas');
  document.getElementById('scene').append(canvas);

  // Glisser : le carton suit le pointeur ; un appui relance une partie en pause
  const retirer = suivrePointeur(ecran, partie.placerCarton, partie.reprendre);

  ecran.append(score, qr);
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
