// Écran Jeu : score en haut à gauche, icônes Pause puis QR en haut à droite, décompte de reprise au milieu ;
// rail, carton, polluants et poissons sont dessinés dans le canvas de #scene (sous le voile).
import { creer, image, boutonIcone, auToucher } from './ui.js';
import textes from '../data/textes.json';
import { suivrePointeur } from '../game/input.js';
import { CONFIG } from '../game/config.js';
import '../styles/game.css';

let nettoyer = null;

/**
 * params :
 *  - partie : partie en cours (game/loop.js), conservée entre les écrans
 *  - scanner() : appelé par l'icône QR (la partie est déjà en pause) ;
 *    null quand tous les QR codes sont scannés : l'icône est alors atténuée et sans effet
 *  - accueil() : bouton Accueil du menu pause (la partie est abandonnée, score non enregistré)
 *  - decompte : vrai au retour du scanner → 3, 2, 1 puis reprise automatique
 */
export function entrer(racine, { partie, scanner, accueil, decompte = false }) {
  const ecran = creer('section', 'ecran ecran-jeu');
  const score = creer('p', 'jeu-score titre');
  const qr = creer('button', 'jeu-qr');
  qr.type = 'button';
  qr.append(image('/assets/icons/bouton-qr.svg', 'jeu-qr__image', 'Scanner un QR code'));

  const pause = creer('button', 'jeu-pause');
  pause.type = 'button';
  pause.append(image('/assets/icons/bouton-pause.svg', 'jeu-pause__image', 'Mettre en pause'));
  const compteur = creerDecompte(() => partie.reprendre());
  const menu = creerMenuPause(partie, accueil, compteur.lancer);

  const afficherScore = (s) => {
    score.textContent = `${s} pts`;
  };
  afficherScore(partie.score);
  partie.ecouterScore(afficherScore);

  // L'icône QR ne déplace pas le carton : elle met en pause et ouvre le scanner
  qr.addEventListener('pointerdown', (e) => e.stopPropagation());
  if (scanner) {
    auToucher(qr, () => {
      compteur.annuler();
      partie.mettreEnPause();
      scanner();
    });
  } else {
    qr.classList.add('est-inactif');
    qr.setAttribute('aria-disabled', 'true');
  }

  // L'icône Pause ne déplace pas le carton : elle met en pause et ouvre le menu
  pause.addEventListener('pointerdown', (e) => e.stopPropagation());
  auToucher(pause, () => {
    compteur.annuler();
    partie.mettreEnPause();
    menu.ouvrir();
  });

  // Canvas de la scène, sous le voile bleu
  const canvas = creer('canvas', 'jeu-canvas');
  document.getElementById('scene').append(canvas);

  // Glisser : le carton suit le pointeur ; un appui relance une partie en pause
  // (sauf pendant le décompte, qui relance la partie lui-même)
  const retirer = suivrePointeur(ecran, partie.placerCarton, () => {
    if (!compteur.enCours()) partie.reprendre();
  });

  ecran.append(score, qr, pause, compteur.element, menu.element);
  racine.append(ecran);
  partie.attacher(canvas);
  if (decompte) {
    partie.mettreEnPause();
    compteur.lancer();
  }

  nettoyer = () => {
    compteur.annuler();
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

/**
 * Décompte au milieu de l'écran (3, 2, 1), puis surFin().
 * lancer() le (re)démarre, annuler() l'arrête sans relancer la partie.
 */
function creerDecompte(surFin) {
  const element = creer('p', 'jeu-decompte titre');
  element.setAttribute('aria-live', 'assertive');
  element.hidden = true;
  let minuteur = 0;
  let reste = 0;

  const afficher = () => {
    element.textContent = String(reste);
    // Relance l'animation d'apparition à chaque chiffre
    element.classList.remove('jeu-decompte--anime');
    void element.offsetWidth;
    element.classList.add('jeu-decompte--anime');
  };
  const etape = () => {
    reste -= 1;
    if (reste > 0) {
      afficher();
      minuteur = setTimeout(etape, 1000);
    } else {
      element.hidden = true;
      minuteur = 0;
      surFin();
    }
  };

  return {
    element,
    enCours: () => minuteur !== 0,
    lancer() {
      clearTimeout(minuteur);
      reste = CONFIG.decompteReprise;
      element.hidden = false;
      afficher();
      minuteur = setTimeout(etape, 1000);
    },
    annuler() {
      clearTimeout(minuteur);
      minuteur = 0;
      element.hidden = true;
    },
  };
}

/** Menu pause par-dessus le jeu : titre, score, Reprendre (avec décompte) et Accueil. */
function creerMenuPause(partie, accueil, decompter) {
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
    decompter(); // la partie reprend après le décompte
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
