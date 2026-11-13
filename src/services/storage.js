// Mémoire locale du navigateur (localStorage) : déblocages en cache, tutoriel vu, dernier pseudo.
// Le serveur reste la référence pour les déblocages ; ceci n'est qu'un cache.
// localStorage peut être indisponible (navigation privée) : on retombe alors sur des valeurs par défaut.

const PREFIXE = 'second-souffle:';

function lire(cle, defaut) {
  try {
    const brut = localStorage.getItem(PREFIXE + cle);
    return brut === null ? defaut : JSON.parse(brut);
  } catch {
    return defaut;
  }
}

function ecrire(cle, valeur) {
  try {
    localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur));
  } catch {
    /* stockage indisponible : la partie continue sans mémoire */
  }
}

/** Ids des polluants débloqués, par exemple ["p1", "p3"]. */
export function lireDebloques() {
  const liste = lire('debloques', []);
  return Array.isArray(liste) ? liste.filter((id) => typeof id === 'string') : [];
}

export function enregistrerDebloques(liste) {
  ecrire('debloques', liste);
}

/** Identifiant du joueur créé par le serveur (null s'il n'existe pas encore). */
export function lireJoueur() {
  const id = lire('joueur', null);
  return typeof id === 'string' && /^[0-9a-f]{32}$/.test(id) ? id : null;
}

export function enregistrerJoueur(id) {
  ecrire('joueur', id);
}

/**
 * Oublie le joueur, ses polluants débloqués et le tutoriel vu : le navigateur redevient un nouveau joueur
 * (bouton « Réinitialiser les QR codes » de l'accueil, ou joueur inconnu du serveur). Le dernier pseudo est gardé.
 */
export function reinitialiserDeblocages() {
  try {
    for (const cle of ['joueur', 'debloques', 'tutorielVu']) localStorage.removeItem(PREFIXE + cle);
  } catch {
    /* stockage indisponible : rien à effacer */
  }
}

/** Le tutoriel n'est affiché qu'une fois. */
export function tutorielVu() {
  return lire('tutorielVu', false) === true;
}

export function marquerTutorielVu() {
  ecrire('tutorielVu', true);
}

/** Dernier pseudo saisi, pré-rempli sur l'écran de fin. */
export function lireDernierPseudo() {
  const pseudo = lire('dernierPseudo', '');
  return typeof pseudo === 'string' ? pseudo : '';
}

export function enregistrerDernierPseudo(pseudo) {
  ecrire('dernierPseudo', pseudo);
}
