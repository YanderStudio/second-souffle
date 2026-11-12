// Écran Accueil : logo, bouton Jouer, bouton Scores
import { creer, image, boutonIcone, auToucher } from './ui.js';
import '../styles/home.css';

/** params.jouer et params.scores : actions des deux boutons */
export function entrer(racine, params) {
  const ecran = creer('section', 'ecran ecran-accueil');
  const jouer = boutonIcone('accueil-jouer', '/assets/icons/bouton-jouer.svg', 'Jouer');
  const scores = boutonIcone('accueil-scores', '/assets/icons/bouton-scores.svg', 'Scores');
  auToucher(jouer, () => params.jouer());
  auToucher(scores, () => params.scores());
  ecran.append(image('/assets/images/logo.svg', 'accueil-logo', 'Second Souffle'), jouer, scores);
  racine.append(ecran);
}

export function quitter() {}
