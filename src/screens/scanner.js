// Écran Scanner (à créer, style de la maquette). Phase 4 : saisie manuelle seule ;
// la caméra et le décodage des QR codes arrivent en phase 7.
import { creer, image, auToucher } from './ui.js';
import textes from '../data/textes.json';
import '../styles/scanner.css';

const t = textes.scanner;

/**
 * params :
 *  - valider(code) → Promise<{ ok, message? }> : tente le déblocage (le parcours change d'écran si ok)
 *  - fermer() : bouton de fermeture
 */
export function entrer(racine, params) {
  const ecran = creer('section', 'ecran ecran-scanner');

  const formulaire = creer('form', 'scanner-code');
  const champ = creer('input', 'scanner-code__champ');
  Object.assign(champ, { type: 'text', maxLength: 20, autocomplete: 'off', spellcheck: false, placeholder: t.placeholder });
  champ.setAttribute('aria-label', t.placeholder);
  champ.autocapitalize = 'characters';
  const valider = creer('button', 'scanner-code__valider');
  valider.type = 'submit';
  valider.setAttribute('aria-label', 'Valider le code');
  valider.append(image('/assets/icons/bouton-jouer.svg'));
  formulaire.append(champ, valider);

  const message = creer('p', 'scanner-message');
  message.setAttribute('role', 'alert');
  const fermer = creer('button', 'scanner-fermer titre', t.fermer);
  fermer.type = 'button';

  ecran.append(creer('p', 'scanner-consigne titre', t.consigne), formulaire, message, fermer);
  racine.append(ecran);

  let enCours = false;
  formulaire.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enCours || !champ.value.trim()) return;
    enCours = true;
    message.textContent = '';
    const reponse = await params.valider(champ.value);
    enCours = false;
    if (!reponse.ok) message.textContent = reponse.message;
  });

  auToucher(fermer, () => params.fermer());
}

export function quitter() {}
