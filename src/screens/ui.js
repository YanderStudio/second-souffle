// Petites fonctions de construction du DOM (toujours via textContent, jamais innerHTML)

/** Crée un élément avec une classe et un texte facultatifs. */
export function creer(balise, classe = '', texte = '') {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  if (texte) el.textContent = texte;
  return el;
}

/** Crée une image décorative ou informative. */
export function image(src, classe = '', alt = '') {
  const img = creer('img', classe);
  img.src = src;
  img.alt = alt;
  img.draggable = false;
  return img;
}

/** Bouton icône + libellé (Jouer, Scores, Accueil). */
export function boutonIcone(classe, icone, libelle) {
  const bouton = creer('button', `bouton-icone ${classe}`);
  bouton.type = 'button';
  bouton.append(image(icone, 'bouton-icone__image'), creer('span', 'bouton-icone__libelle', libelle));
  return bouton;
}

/** Score affiché avec séparateur de milliers français. */
export const formaterScore = (n) => Number(n).toLocaleString('fr-FR');

/** Ligne de classement « pseudo ........ score » (classement et top 5 de fin). */
export function ligneScore(pseudo, score) {
  const ligne = creer('li', 'scores-ligne');
  ligne.append(creer('span', '', pseudo), creer('span', 'pointilles', '.'.repeat(80)), creer('span', 'scores-ligne__score', formaterScore(score)));
  return ligne;
}

/** Associe une action au relâchement du pointeur (souris et tactile). */
export function auToucher(el, action) {
  el.addEventListener('pointerup', (e) => {
    if (e.button > 0) return; // ignore clic droit / milieu
    action(e);
  });
}
