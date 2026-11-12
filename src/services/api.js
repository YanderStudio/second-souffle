// Accès au serveur : tous les appels passent ici (délai maximal et gestion d'erreur communs).
// Chaque fonction renvoie { ok: true, ...données } ou { ok: false, statut, message } — jamais d'exception.
// statut 0 = serveur injoignable ou trop lent.
import * as stockage from './storage.js';
import textes from '../data/textes.json';

const DELAI_MAX = 8000; // ms
const t = textes.erreurs;
// Message renvoyé par l'API quand le player_id n'existe pas (base réinitialisée)
const JOUEUR_INCONNU = 'Joueur inconnu.';

/** Appel JSON vers /api/… avec délai maximal. */
async function appeler(methode, route, corps) {
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), DELAI_MAX);
  try {
    const reponse = await fetch(`/api/${route}`, {
      method: methode,
      headers: corps ? { 'Content-Type': 'application/json' } : {},
      body: corps ? JSON.stringify(corps) : undefined,
      signal: controleur.signal,
    });
    const donnees = await reponse.json().catch(() => ({}));
    if (reponse.ok) return { ok: true, ...donnees };
    const message = typeof donnees.erreur === 'string' ? donnees.erreur : t.serveur;
    return { ok: false, statut: reponse.status, message };
  } catch {
    return { ok: false, statut: 0, message: t.injoignable };
  } finally {
    clearTimeout(minuterie);
  }
}

/** player_id du navigateur, créé par le serveur au premier besoin. */
async function joueur() {
  const existant = stockage.lireJoueur();
  if (existant) return { ok: true, id: existant };
  const reponse = await appeler('POST', 'players.php');
  if (!reponse.ok) return reponse;
  stockage.enregistrerJoueur(reponse.player_id);
  return { ok: true, id: reponse.player_id };
}

/**
 * Appel au nom du joueur. Si le serveur ne le connaît plus (base vidée), le navigateur redevient
 * un nouveau joueur : ses déblocages en cache sont oubliés, puis l'appel est refait une fois.
 */
async function appelerCommeJoueur(route, champs) {
  for (let essai = 0; essai < 2; essai++) {
    const j = await joueur();
    if (!j.ok) return j;
    const reponse = await appeler('POST', route, { player_id: j.id, ...champs });
    if (reponse.ok || reponse.statut !== 400 || reponse.message !== JOUEUR_INCONNU) return reponse;
    stockage.reinitialiserDeblocages();
  }
  return { ok: false, statut: 400, message: t.serveur };
}

/** Débloque un polluant avec le code saisi ou scanné ; met à jour le cache local des déblocages. */
export async function debloquer(code) {
  const reponse = await appelerCommeJoueur('unlocks.php', { code: String(code) });
  if (reponse.ok) stockage.enregistrerDebloques(reponse.unlocked);
  return reponse;
}

/** Jeton à usage unique d'une nouvelle partie. 403 : p1 non débloqué selon le serveur. */
export async function commencerPartie() {
  return appelerCommeJoueur('games.php', {});
}

/** Envoie la partie ; le serveur calcule le score et renvoie { score, rank }. */
export async function envoyerScore(jeton, pseudo, compteurs, duree) {
  return appeler('POST', 'scores.php', { game_token: jeton, pseudo, counts: compteurs, duree });
}

/** Dix meilleurs scores : { ok, scores: [{ pseudo, score }] }. */
export async function lireClassement() {
  return appeler('GET', 'scores.php');
}
