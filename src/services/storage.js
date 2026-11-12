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

/** Oublie les polluants débloqués et le tutoriel vu (bouton provisoire de l'accueil). */
export function reinitialiserDeblocages() {
  try {
    localStorage.removeItem(PREFIXE + 'debloques');
    localStorage.removeItem(PREFIXE + 'tutorielVu');
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
