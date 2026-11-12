// Écrans de fin : saisie du pseudo, puis récapitulatif (pseudo et score), chacun avec le top 5
import { creer, image, boutonIcone, auToucher, formaterScore, ligneScore } from './ui.js';
import textes from '../data/textes.json';
import '../styles/gameover.css';

const MOTIF_PSEUDO = /^[\p{L}\p{N} _=\{\}\[\]<>-]{3,15}$/u; // même règle que le serveur
const t = textes.fin;

/**
 * Bloc « Top 5 » : place réservée tout de suite (pas de saut de mise en page),
 * lignes ajoutées quand le classement arrive ; message si le serveur ne répond pas.
 */
function blocTop5(chargement) {
  const bloc = creer('div', 'fin-top5');
  const liste = creer('ol', 'fin-top5__liste');
  bloc.append(creer('p', 'fin-top5__titre titre', t.top5), liste);
  chargement.then((reponse) => {
    if (reponse.ok) liste.append(...reponse.lignes.slice(0, 5).map(({ pseudo, score }) => ligneScore(pseudo, score)));
    else liste.append(creer('li', 'fin-top5__message', textes.erreurs.classement));
  });
  return bloc;
}

/**
 * params : { score, pseudoInitial?, enregistrer(pseudo) → Promise<{ok, message?, peutQuitter?}>,
 *            classement() → Promise<{ ok, lignes? }>, accueil() }
 */
export function entrer(racine, params) {
  const ecran = creer('section', 'ecran ecran-fin ecran-fin--saisie');
  const carte = creer('div', 'fin-carte');
  carte.append(
    creer('p', 'fin-carte__titre titre', t.scoreFinal),
    creer('p', 'fin-carte__score', formaterScore(params.score)),
    image('/assets/images/corail.png', 'corail fin-carte__corail'),
  );

  const formulaire = creer('form', 'fin-pseudo');
  const champ = creer('input', 'fin-pseudo__champ');
  Object.assign(champ, { type: 'text', maxLength: 15, autocomplete: 'off', spellcheck: false });
  champ.setAttribute('aria-label', 'Pseudo');
  champ.value = params.pseudoInitial ?? '';
  const valider = creer('button', 'fin-pseudo__valider');
  valider.type = 'submit';
  valider.setAttribute('aria-label', 'Valider le pseudo');
  valider.append(image('/assets/icons/bouton-jouer.svg'));
  formulaire.append(champ, valider);

  const message = creer('p', 'fin-message');
  message.setAttribute('role', 'alert');
  const accueil = boutonIcone('bouton-accueil est-inactif', '/assets/icons/bouton-accueil.svg', 'Accueil');

  ecran.append(
    creer('p', 'fin-perdu titre', t.perdu),
    carte,
    blocTop5(params.classement()),
    creer('p', 'fin-label titre', t.pseudo),
    formulaire,
    message,
    accueil,
  );
  racine.append(ecran);

  let enCours = false;
  let peutQuitter = false; // devient vrai si l'envoi échoue : le joueur n'est jamais bloqué
  // Entrée (submit du formulaire) ou bouton Play : valide le pseudo
  formulaire.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enCours) return;
    const pseudo = champ.value.trim();
    if (!pseudo) return (message.textContent = t.pseudoManquant);
    if (!MOTIF_PSEUDO.test(pseudo)) return (message.textContent = t.pseudoInvalide);
    enCours = true;
    message.textContent = '';
    const reponse = await params.enregistrer(pseudo);
    enCours = false;
    if (reponse.ok) return afficherRecap(racine, params, pseudo);
    message.textContent = reponse.message;
    // Échec d'envoi (hors pseudo refusé) : réessayer reste possible, Accueil devient actif
    if (reponse.peutQuitter) {
      peutQuitter = true;
      accueil.classList.remove('est-inactif');
    }
  });

  // Accueil inactif tant que le pseudo n'est pas enregistré (sauf échec d'envoi)
  auToucher(accueil, () => {
    if (peutQuitter) return params.accueil();
    message.textContent = t.pseudoManquant;
    champ.focus();
  });
}

/** Récapitulatif : pseudo et score, top 5 relu (il inclut le score enregistré), Accueil actif. */
function afficherRecap(racine, params, pseudo) {
  const ecran = creer('section', 'ecran ecran-fin ecran-fin--recap');
  const ligne = creer('p', 'fin-carte__ligne');
  ligne.append(
    creer('span', 'fin-carte__pseudo', pseudo),
    creer('span', 'pointilles', '.'.repeat(80)),
    creer('span', 'fin-carte__points', formaterScore(params.score)),
  );
  const carte = creer('div', 'fin-carte');
  carte.append(creer('p', 'fin-carte__titre titre', t.scoreFinal), ligne, image('/assets/images/corail.png', 'corail fin-carte__corail'));
  const accueil = boutonIcone('bouton-accueil', '/assets/icons/bouton-accueil.svg', 'Accueil');
  auToucher(accueil, () => params.accueil());
  ecran.append(creer('p', 'fin-perdu titre', t.perdu), carte, blocTop5(params.classement()), accueil);
  racine.replaceChildren(ecran);
}

export function quitter() {}
