// Sons du jeu. Ajouter un son : déposer le fichier dans public/assets/sons/ et l'indiquer ici.
// Plusieurs fichiers pour un même nom : l'un d'eux est tiré au hasard à chaque fois.
// Appels placés : 'clic' (boutons et dialogues), 'plouf' (lancement d'une partie : fermeture de la
// fiche du premier polluant la toute première fois, puis bouton Jouer),
// 'ramassage', 'defaite', 'deblocage' (encore muets : aucun fichier).
// Voix des personnages : fichiers indiqués dans textes.json (personnages → voix), joués par parler().
import textes from '../data/textes.json';

const VOLUME_VOIX = 0.35; // les sons de voix sont enregistrés très fort
const HAUTEUR_VOIX = [0.92, 1.12]; // légère variation de hauteur à chaque son, comme une vraie voix
// Volume de chaque son (1 = volume du fichier) ; absent = 1
const VOLUMES = { clic: 0.6 };

const SONS = {
  clic: ['/assets/sons/water-click.mp3', '/assets/sons/water-click2.mp3'],
  plouf: ['/assets/sons/water-splash.mp3'],
  ramassage: [],
  defaite: [],
  deblocage: [],
};

// Web Audio plutôt que <audio> : les sons sont décodés une fois au démarrage
// et partent sans délai (la balise <audio> ajoute un retard sensible, surtout sur téléphone).
let contexte = null;
const tampons = new Map(); // fichier → { tampon, debut (s) }

/** Charge et décode tous les sons ; à appeler au lancement de l'application. */
export function prechargerSons() {
  const Contexte = window.AudioContext || window.webkitAudioContext;
  if (!Contexte || contexte) return;
  contexte = new Contexte();
  // Le navigateur garde le son bloqué jusqu'au premier geste : on le débloque dès le premier appui
  const debloquer = () => contexte.resume().catch(() => {});
  document.addEventListener('pointerdown', debloquer, { capture: true });
  document.addEventListener('keydown', debloquer, { capture: true });

  const voix = Object.values(textes.personnages).flatMap((p) => p.voix ?? []);
  for (const fichier of new Set([...Object.values(SONS).flat(), ...voix])) {
    fetch(fichier)
      .then((reponse) => reponse.arrayBuffer())
      .then((donnees) => contexte.decodeAudioData(donnees))
      .then((tampon) => tampons.set(fichier, { tampon, debut: debutDuSon(tampon) }))
      .catch(() => {}); // son introuvable ou illisible : il restera muet
  }
}

/** Instant (s) où le son commence vraiment : le silence du début du fichier est sauté. */
function debutDuSon(tampon) {
  const donnees = tampon.getChannelData(0);
  let pic = 0;
  for (const v of donnees) pic = Math.max(pic, Math.abs(v));
  const seuil = pic * 0.02;
  let i = 0;
  while (i < donnees.length && Math.abs(donnees[i]) < seuil) i++;
  return Math.max(0, i / tampon.sampleRate - 0.005); // 5 ms de marge pour ne pas couper l'attaque
}

/** Joue un des fichiers (tiré au hasard), au volume et à la hauteur donnés ; rien s'il n'est pas chargé. */
function jouerUnDe(fichiers, volume = 1, hauteur = 1) {
  if (!contexte || !fichiers.length) return;
  const son = tampons.get(fichiers[Math.floor(Math.random() * fichiers.length)]);
  if (!son) return;
  if (contexte.state !== 'running') contexte.resume().catch(() => {});
  const source = contexte.createBufferSource();
  source.buffer = son.tampon;
  source.playbackRate.value = hauteur;
  const gain = contexte.createGain();
  gain.gain.value = volume;
  source.connect(gain).connect(contexte.destination);
  source.start(0, son.debut);
}

/** Joue le son nommé ; ne fait rien s'il n'a pas de fichier ou n'est pas encore chargé. */
export function play(nom) {
  jouerUnDe(SONS[nom] ?? [], VOLUMES[nom] ?? 1);
}

/** Une « syllabe » de la voix d'un personnage : un de ses sons, hauteur légèrement variée. */
export function parler(voix = []) {
  const [min, max] = HAUTEUR_VOIX;
  jouerUnDe(voix, VOLUME_VOIX, min + Math.random() * (max - min));
}
