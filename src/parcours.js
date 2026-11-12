// Parcours entre les écrans (§6 du brief) :
//  - première fois : Accueil → Explication → Scanner (p1) → Tutoriel → Fiche → Jeu
//  - ensuite : Accueil → Jeu
//  - en jeu : icône QR (pause) → Scanner → Fiche → retour au Jeu, décompte 3, 2, 1 puis reprise
//  - défaite : Fin (saisie) → Fin (récapitulatif) → Accueil
import { aller } from './router.js';
import { creerPartie } from './game/loop.js';
import { prechargerImages } from './game/entities.js';
import * as api from './services/api.js';
import { play } from './services/audio.js';
import * as stockage from './services/storage.js';
import textes from './data/textes.json';
import { polluants } from './data/polluants.json';

// Partie en cours, conservée pendant le scanner et la fiche ; null hors partie
let partie = null;
let jeton = null; // jeton de la partie en cours (null si le serveur était injoignable au départ)
let demarrage = false; // évite de lancer deux parties sur un double appui

const p1Debloque = () => stockage.lireDebloques().includes('p1');

export function versAccueil() {
  partie = null;
  aller('accueil', { jouer: jouerDepuisAccueil, scores: versClassement });
}

/** Jouer : la partie se lance directement (plouf) si p1 est débloqué, sinon l'Explication (clic). */
function jouerDepuisAccueil() {
  if (p1Debloque()) {
    play('plouf');
    nouvellePartie();
  } else {
    play('clic');
    versExplication();
  }
}

/** Classement partagé lu sur le serveur ; en cas d'échec, liste vide et message. */
async function versClassement() {
  const reponse = await api.lireClassement();
  aller('classement', {
    lignes: reponse.ok ? reponse.scores : [],
    message: reponse.ok ? '' : textes.erreurs.classement,
    accueil: versAccueil,
  });
}

function versExplication() {
  aller('dialogue', { ...textes.explication, suivant: versScanner });
}

/** Scanner : depuis l'Explication (hors partie) ou depuis le jeu (partie en pause). */
function versScanner() {
  aller('scanner', {
    valider: async (code) => {
      const avant = stockage.lireDebloques();
      const reponse = await api.debloquer(code);
      if (!reponse.ok) return reponse;
      // QR code déjà scanné : refusé avec un message, on reste sur le scanner
      if (avant.includes(reponse.polluant_id)) return { ok: false, message: textes.scanner.dejaScanne };
      apresDeblocage(reponse.polluant_id);
      return reponse;
    },
    // Fermer ramène au jeu en pause, ou à l'accueil hors partie
    fermer: () => (partie ? versJeu({ decompte: true }) : versAccueil()),
  });
}

/** Un nouveau code valide affiche la fiche ; le tutoriel passe avant, une seule fois. */
function apresDeblocage(id) {
  play('deblocage');
  if (id === 'p1' && !stockage.tutorielVu()) {
    stockage.marquerTutorielVu();
    // Première partie : le plouf accompagne la fermeture de la fiche du premier polluant
    aller('dialogue', { ...textes.tutoriel, suivant: () => versFiche(id, 'plouf') });
  } else {
    versFiche(id);
  }
}

/** Fiche polluant ; la flèche mène au jeu : reprise de la partie en cours, sinon nouvelle partie. */
function versFiche(id, sonSuivant) {
  const p = polluants.find((x) => x.id === id);
  aller('dialogue', {
    personnage: p.personnage,
    texte: p.texte,
    polluantImage: p.imageFiche ?? p.image,
    sonSuivant,
    suivant: () => (partie ? versJeu({ decompte: true }) : nouvellePartie()),
  });
}

async function nouvellePartie() {
  if (demarrage) return;
  if (!p1Debloque()) return versExplication();
  demarrage = true;
  const [reponse] = await Promise.all([api.commencerPartie(), prechargerImages().catch(() => {})]);
  demarrage = false;

  // Le serveur (la référence) dit que p1 n'est pas débloqué : le cache local était faux
  if (!reponse.ok && reponse.statut === 403) {
    stockage.enregistrerDebloques([]);
    return versExplication();
  }
  // Serveur injoignable : on joue quand même, le score ne pourra pas être enregistré
  jeton = reponse.ok ? reponse.game_token : null;
  if (!p1Debloque()) return versExplication(); // joueur recréé par le serveur entre-temps

  partie = creerPartie({
    debloques: stockage.lireDebloques, // relu à chaque apparition : un déblocage en jeu compte dès la reprise
    surDefaite: (bilan) => {
      partie = null;
      versFin(bilan, jeton);
    },
  });
  versJeu();
}

/** Jeu ; decompte : retour dans une partie en pause (après le scanner) → 3, 2, 1 puis reprise automatique. */
function versJeu({ decompte = false } = {}) {
  // Tous les QR codes scannés : l'icône QR devient inactive
  const toutDebloque = polluants.every((p) => stockage.lireDebloques().includes(p.id));
  aller('jeu', { partie, decompte, scanner: toutDebloque ? null : versScanner, accueil: versAccueil });
}

/**
 * Fin de partie : le score affiché est celui du jeu ; le serveur recalcule et enregistre.
 * En cas d'échec, le joueur peut réessayer ou revenir à l'accueil (peutQuitter),
 * sauf pseudo refusé (400) : il le corrige.
 */
function versFin(bilan, jetonPartie) {
  aller('fin', {
    score: bilan.score,
    pseudoInitial: stockage.lireDernierPseudo(),
    enregistrer: async (pseudo) => {
      if (!jetonPartie) return { ok: false, message: textes.erreurs.scoreNonEnregistre, peutQuitter: true };
      const duree = Math.round(bilan.duree * 1000) / 1000; // temps de jeu hors pauses (s)
      const reponse = await api.envoyerScore(jetonPartie, pseudo, bilan.compteurs, duree);
      if (reponse.ok) {
        stockage.enregistrerDernierPseudo(pseudo); // pré-rempli la prochaine fois
        return { ok: true };
      }
      return { ok: false, message: reponse.message, peutQuitter: reponse.statut !== 400 };
    },
    // Top 5 des écrans de fin (relu à l'ouverture de chaque écran)
    classement: async () => {
      const reponse = await api.lireClassement();
      return reponse.ok ? { ok: true, lignes: reponse.scores } : { ok: false };
    },
    accueil: versAccueil,
  });
}
