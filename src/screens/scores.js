// Écran Classement : dix meilleurs scores, bouton Accueil
import { creer, boutonIcone, auToucher } from './ui.js';
import { formaterScore } from './gameover.js';
import textes from '../data/textes.json';
import '../styles/scores.css';

/** params : { lignes: [{ pseudo, score }], accueil() } */
export function entrer(racine, params) {
  const ecran = creer('section', 'ecran ecran-scores');
  const liste = creer('ol', 'scores-liste');
  for (const { pseudo, score } of params.lignes.slice(0, 10)) {
    const ligne = creer('li', 'scores-ligne');
    ligne.append(creer('span', '', pseudo), creer('span', 'pointilles', '.'.repeat(80)), creer('span', 'scores-ligne__score', formaterScore(score)));
    liste.append(ligne);
  }
  const accueil = boutonIcone('bouton-accueil', '/assets/icons/bouton-accueil.svg', 'Accueil');
  auToucher(accueil, () => params.accueil());
  ecran.append(creer('h1', 'scores-titre titre', textes.classement.titre), liste, accueil);
  racine.append(ecran);
}

export function quitter() {}
