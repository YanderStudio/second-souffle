// Écran Accueil : logo, bouton Jouer, bouton Scores
import { creer, image, boutonIcone, auToucher } from './ui.js';
import { reinitialiserDeblocages } from '../services/storage.js';
import '../styles/home.css';

// PROVISOIRE (tests) : true affiche un bouton qui oublie les polluants débloqués et le tutoriel vu ;
// false le masque. À passer à false (ou supprimer) pour l'exposition.
const BOUTON_REINITIALISER = true;

/** params.jouer et params.scores : actions des deux boutons */
export function entrer(racine, params) {
  const ecran = creer('section', 'ecran ecran-accueil');
  const jouer = boutonIcone('accueil-jouer', '/assets/icons/bouton-jouer.svg', 'Jouer');
  const scores = boutonIcone('accueil-scores', '/assets/icons/bouton-scores.svg', 'Scores');
  auToucher(jouer, () => params.jouer());
  auToucher(scores, () => params.scores());
  ecran.append(image('/assets/images/logo.svg', 'accueil-logo', 'Second Souffle'), jouer, scores);

  if (BOUTON_REINITIALISER) {
    const reinit = creer('button', 'accueil-reinit', 'Réinitialiser les QR codes');
    reinit.type = 'button';
    auToucher(reinit, () => {
      reinitialiserDeblocages();
      reinit.textContent = 'QR codes réinitialisés';
    });
    ecran.append(reinit);
  }
  racine.append(ecran);
}

export function quitter() {}
