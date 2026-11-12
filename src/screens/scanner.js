// Écran Scanner (à créer, style de la maquette) : flux caméra, consigne, saisie manuelle, fermeture.
// Un QR lu par la caméra suit le même chemin qu'un code tapé à la main.
import { creer, image, auToucher } from './ui.js';
import { lecteurQr, ouvrirCamera } from '../services/camera.js';
import { play } from '../services/audio.js';
import textes from '../data/textes.json';
import '../styles/scanner.css';

const t = textes.scanner;
const PAUSE_LECTURE = 250; // ms entre deux analyses de l'image
const ATTENTE_APRES_ECHEC = 3000; // ms sans relecture après « injoignable » ou « trop de requêtes »

let arreter = null;

/**
 * params :
 *  - valider(code) → Promise<{ ok, statut?, message? }> : tente le déblocage (le parcours change d'écran si ok)
 *  - fermer() : bouton de fermeture
 */
export function entrer(racine, params) {
  const ecran = creer('section', 'ecran ecran-scanner');
  const video = creer('video', 'scanner-video');
  Object.assign(video, { muted: true, playsInline: true, autoplay: true });
  video.setAttribute('aria-hidden', 'true');

  const consigne = creer('p', 'scanner-consigne titre', t.consigne);
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

  // Guide de visée (coins orange) au milieu de l'image de la caméra
  const guide = image('/assets/icons/guide-qr.svg', 'scanner-guide');
  guide.setAttribute('aria-hidden', 'true');

  ecran.append(video, guide, consigne, formulaire, message, fermer);
  racine.append(ecran);

  let actif = true;
  let enCours = false;
  const refuses = new Set(); // codes déjà refusés par le serveur : la caméra ne les renvoie pas
  let repriseCamera = 0; // instant avant lequel la caméra ne renvoie rien (après un échec passager)

  /** Tente un code (saisi ou lu) ; affiche le message en cas de refus. */
  async function tenter(code) {
    if (enCours) return;
    enCours = true;
    message.textContent = '';
    const reponse = await params.valider(code);
    enCours = false;
    if (!actif || reponse.ok) return;
    message.textContent = reponse.message;
    // Refus définitif (code inconnu, p1 requis, déjà scanné) : inutile de le relire ;
    // injoignable ou trop de requêtes : la caméra réessaiera, mais pas avant quelques secondes
    if (reponse.statut === 0 || reponse.statut === 429) repriseCamera = performance.now() + ATTENTE_APRES_ECHEC;
    else refuses.add(code);
  }

  formulaire.addEventListener('submit', (e) => {
    e.preventDefault();
    play('clic');
    if (champ.value.trim()) tenter(champ.value);
  });
  auToucher(fermer, () => params.fermer());

  // Caméra : refusée ou absente → saisie manuelle seule, avec une phrase d'explication
  let fermerCamera = null;
  ouvrirCamera(video).then(async (camera) => {
    if (!actif) return camera.ok && camera.arreter(); // écran déjà quitté
    if (!camera.ok) {
      ecran.classList.add('sans-camera');
      consigne.textContent = t.sansCamera;
      return;
    }
    fermerCamera = camera.arreter;
    const lecteur = await lecteurQr().catch(() => null);
    if (!lecteur) {
      // Lecteur impossible à charger : même repli que sans caméra
      fermerCamera();
      ecran.classList.add('sans-camera');
      consigne.textContent = t.sansCamera;
      return;
    }
    while (actif) {
      if (!enCours && video.readyState >= 2 && performance.now() >= repriseCamera) {
        const codes = await lecteur.detect(video).catch(() => []);
        const code = codes[0]?.rawValue?.replace(/\s+/g, '').toUpperCase();
        if (actif && code && !refuses.has(code)) await tenter(code);
      }
      await new Promise((ok) => setTimeout(ok, PAUSE_LECTURE));
    }
  });

  // Quitter l'écran coupe la lecture et le flux caméra
  arreter = () => {
    actif = false;
    fermerCamera?.();
  };
}

export function quitter() {
  arreter?.();
  arreter = null;
}
