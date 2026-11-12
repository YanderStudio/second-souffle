// Parcours entre les écrans (§6 du brief) :
//  - première fois : Accueil → Explication → Scanner (p1) → Tutoriel → Fiche → Jeu
//  - ensuite : Accueil → Jeu
//  - en jeu : icône QR (pause) → Scanner → Fiche → retour au Jeu en pause
//  - défaite : Fin (saisie) → Fin (récapitulatif) → Accueil
import { aller } from './router.js';
import { creerPartie } from './game/loop.js';
import { prechargerImages } from './game/entities.js';
import { debloquer } from './services/api.js';
import { play } from './services/audio.js';
import * as stockage from './services/storage.js';
import textes from './data/textes.json';
import { polluants } from './data/polluants.json';

// Classement fictif jusqu'au branchement de l'API (phase 6)
const SCORES_FICTIFS = Array.from({ length: 10 }, (_, i) => ({ pseudo: `Joueur ${i + 1}`, score: 12000 - i * 1150 }));

// Partie en cours, conservée pendant le scanner et la fiche ; null hors partie
let partie = null;

const p1Debloque = () => stockage.lireDebloques().includes('p1');

export function versAccueil() {
  partie = null;
  aller('accueil', { jouer: () => (p1Debloque() ? nouvellePartie() : versExplication()), scores: versClassement });
}

function versClassement() {
  aller('classement', { lignes: SCORES_FICTIFS, accueil: versAccueil });
}

function versExplication() {
  aller('dialogue', { ...textes.explication, suivant: versScanner });
}

/** Scanner : depuis l'Explication (hors partie) ou depuis le jeu (partie en pause). */
function versScanner() {
  aller('scanner', {
    valider: async (code) => {
      const avant = stockage.lireDebloques();
      const reponse = await debloquer(code);
      if (reponse.ok) apresDeblocage(reponse.polluant_id, !avant.includes(reponse.polluant_id));
      return reponse;
    },
    // Fermer ramène au jeu en pause, ou à l'accueil hors partie
    fermer: () => (partie ? versJeu() : versAccueil()),
  });
}

/** Un code valide (nouveau ou déjà utilisé) affiche la fiche ; le tutoriel passe avant, une seule fois. */
function apresDeblocage(id, nouveau) {
  if (nouveau) play('deblocage');
  if (id === 'p1' && !stockage.tutorielVu()) {
    stockage.marquerTutorielVu();
    aller('dialogue', { ...textes.tutoriel, suivant: () => versFiche(id) });
  } else {
    versFiche(id);
  }
}

/** Fiche polluant ; la flèche mène au jeu : reprise de la partie en cours, sinon nouvelle partie. */
function versFiche(id) {
  const p = polluants.find((x) => x.id === id);
  aller('dialogue', {
    personnage: p.personnage,
    texte: p.texte,
    polluantImage: p.imageFiche ?? p.image,
    suivant: () => (partie ? versJeu() : nouvellePartie()),
  });
}

async function nouvellePartie() {
  if (!p1Debloque()) return versExplication();
  await prechargerImages().catch(() => {}); // une image manquante ne bloque pas le joueur
  partie = creerPartie({
    debloques: stockage.lireDebloques, // relu à chaque apparition : un déblocage en jeu compte dès la reprise
    surDefaite: (bilan) => {
      partie = null;
      versFin(bilan.score);
    },
  });
  versJeu();
}

function versJeu() {
  aller('jeu', { partie, scanner: versScanner });
}

function versFin(score) {
  aller('fin', {
    score,
    pseudoInitial: stockage.lireDernierPseudo(),
    // Envoi simulé jusqu'à la phase 6 ; le pseudo est retenu pour la prochaine fois
    enregistrer: async (pseudo) => {
      stockage.enregistrerDernierPseudo(pseudo);
      return { ok: true };
    },
    accueil: versAccueil,
  });
}
