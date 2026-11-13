// Musique de fond : jouée en boucle dès le premier appui sur l'écran, coupée quand l'application est cachée.
// Lue par un lecteur <audio> (le fichier est long : le décoder en entier comme les autres sons prendrait
// trop de mémoire), branché sur le contexte Web Audio pour régler le volume (iPhone ignore .volume).
import { contexteAudio } from './audio.js';

const FICHIER = '/assets/sons/musique-nautilus.mp3';
const VOLUME = 0.4; // 1 = volume du fichier

let lecteur = null;
let demarree = false; // le joueur a touché l'écran : la musique doit tourner

/** Prépare la musique ; à appeler une fois au lancement, après prechargerSons(). */
export function lancerMusique() {
  if (lecteur) return;
  lecteur = new Audio();
  lecteur.loop = true;

  // Fichier récupéré par fetch (donc gardé par le service worker, disponible hors ligne), puis lu depuis la mémoire
  fetch(FICHIER)
    .then((reponse) => (reponse.ok ? reponse.blob() : Promise.reject()))
    .then((donnees) => {
      lecteur.src = URL.createObjectURL(donnees);
      if (demarree) jouer();
    })
    .catch(() => {}); // fichier introuvable : pas de musique, le jeu continue

  const contexte = contexteAudio();
  if (contexte) {
    const gain = contexte.createGain();
    gain.gain.value = VOLUME;
    contexte.createMediaElementSource(lecteur).connect(gain).connect(contexte.destination);
  } else {
    lecteur.volume = VOLUME;
  }

  // Le navigateur n'autorise le son qu'après un geste : on démarre au premier appui (relâché) ou touche
  document.addEventListener('pointerup', demarrer, { capture: true });
  document.addEventListener('keydown', demarrer, { capture: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) lecteur.pause();
    else if (demarree) jouer();
  });
}

function demarrer() {
  demarree = true;
  jouer();
}

/** Lance la lecture ; une fois partie, plus besoin d'écouter les appuis. */
function jouer() {
  if (!lecteur.src || !lecteur.paused || document.hidden) return;
  lecteur
    .play()
    .then(() => {
      document.removeEventListener('pointerup', demarrer, { capture: true });
      document.removeEventListener('keydown', demarrer, { capture: true });
    })
    .catch(() => {}); // refusé (pas encore de geste reconnu) : nouvel essai au prochain appui
}
