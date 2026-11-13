// Écran Classement : dix meilleurs scores, bouton Accueil
import { creer, boutonIcone, auToucher, ligneScore } from './ui.js';
import textes from '../data/textes.json';
import '../styles/scores.css';

/** params : { lignes: [{ pseudo, score }], message?: texte si le classement n'a pas pu être lu, accueil() } */
export function entrer(racine, params) {
  const ecran = creer('section', 'ecran ecran-scores');
  const liste = creer('ol', 'scores-liste');
  liste.append(...params.lignes.slice(0, 10).map(({ pseudo, score }) => ligneScore(pseudo, score)));
  const accueil = boutonIcone('bouton-accueil', '/assets/icons/bouton-accueil.svg', 'Accueil');
  auToucher(accueil, () => params.accueil());
  ecran.append(creer('h1', 'scores-titre titre', textes.classement.titre), liste, accueil);
  if (params.message) ecran.append(creer('p', 'scores-message', params.message));
  racine.append(ecran);
}

export function quitter() {}
