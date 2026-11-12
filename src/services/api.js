// Accès au serveur. Phase 4 : déblocage SIMULÉ, sans serveur (remplacé par POST /api/unlocks.php en phase 6).
// Les vrais codes restent côté serveur (api/config.php) : la simulation accepte P1 à P5.
import { lireDebloques, enregistrerDebloques } from './storage.js';

/** Normalise une saisie : insensible à la casse, espaces ignorés. */
export function normaliserCode(saisie) {
  return String(saisie).replace(/\s+/g, '').toUpperCase();
}

/**
 * Débloque le polluant correspondant au code.
 * Réponse calquée sur l'API : { ok: true, polluant_id, unlocked } ou { ok: false, statut, message }.
 */
export async function debloquer(saisie) {
  const code = normaliserCode(saisie);
  const trouve = /^P([1-5])$/.exec(code);
  if (!trouve) return { ok: false, statut: 404, message: 'Code inconnu.' };

  const id = `p${trouve[1]}`;
  const debloques = lireDebloques();
  if (id !== 'p1' && !debloques.includes('p1')) {
    return { ok: false, statut: 409, message: 'Scannez d’abord le premier QR code' };
  }
  const unlocked = debloques.includes(id) ? debloques : [...debloques, id];
  enregistrerDebloques(unlocked); // cache local de la liste renvoyée
  return { ok: true, polluant_id: id, unlocked };
}
