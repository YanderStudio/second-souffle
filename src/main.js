// Point d'entrée : styles, enregistrement des écrans, parcours
import './styles/tokens.css';
import './styles/base.css';
import { initialiser, enregistrer, aller } from './router.js';
import * as accueil from './screens/home.js';
import * as dialogue from './screens/dialog.js';
import * as fin from './screens/gameover.js';
import * as classement from './screens/scores.js';
import * as jeu from './screens/game.js';
import { creerPartie } from './game/loop.js';
import { prechargerImages } from './game/entities.js';
import textes from './data/textes.json';
import { polluants } from './data/polluants.json';

initialiser(document.getElementById('ecran'));
enregistrer('accueil', accueil);
enregistrer('dialogue', dialogue);
enregistrer('fin', fin);
enregistrer('classement', classement);
enregistrer('jeu', jeu);

// --- Parcours provisoire des phases 2 et 3 (données fictives, remplacé en phases 4 et 6) ---
// Phase 3 : tous les polluants considérés comme débloqués
const DEBLOQUES_FICTIFS = polluants.map((p) => p.id);
const SCORES_FICTIFS = Array.from({ length: 10 }, (_, i) => ({ pseudo: `Joueur ${i + 1}`, score: 12000 - i * 1150 }));

function versAccueil() {
  aller('accueil', { jouer: versJeu, scores: versClassement });
}
async function versJeu() {
  await prechargerImages();
  const partie = creerPartie({
    debloques: () => DEBLOQUES_FICTIFS,
    surDefaite: (bilan) => versFin(bilan.score),
  });
  aller('jeu', { partie });
}
function versClassement() {
  aller('classement', { lignes: SCORES_FICTIFS, accueil: versAccueil });
}
function versExplication() {
  aller('dialogue', { ...textes.explication, suivant: versTutoriel });
}
function versTutoriel() {
  aller('dialogue', { ...textes.tutoriel, suivant: () => versFiche(0) });
}
function versFiche(i) {
  const p = polluants[i];
  const suivant = i < polluants.length - 1 ? () => versFiche(i + 1) : versFin;
  aller('dialogue', { personnage: p.personnage, texte: p.texte, polluantImage: p.imageFiche ?? p.image, suivant });
}
function versFin(score = 4250) {
  aller('fin', { score, enregistrer: async () => ({ ok: true }), accueil: versAccueil });
}

versAccueil();

// Outil de développement : naviguer depuis la console (absent du build)
if (import.meta.env.DEV) {
  window.__ecrans = { versAccueil, versClassement, versExplication, versTutoriel, versFiche, versFin, versJeu };
}
