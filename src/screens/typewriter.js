// Effet « visual novel » : le texte apparaît lettre par lettre.
// Le texte complet est réservé en invisible dès le début : la bulle a sa taille finale.

/**
 * @param {HTMLElement} el      conteneur du texte
 * @param {string} texte        texte complet
 * @param {object} options      vitesse (lettres/s), alternanceMs, surBouche(ouverte)
 */
export function ecrireLettreParLettre(el, texte, { vitesse = 30, alternanceMs = 130, surBouche = () => {} } = {}) {
  const visible = document.createElement('span');
  const reserve = document.createElement('span');
  reserve.style.visibility = 'hidden';
  el.replaceChildren(visible, reserve);

  const lettres = Array.from(texte); // gère correctement les caractères accentués composés
  let affichees = -1;
  let debut = null;
  let idFrame = 0;
  let termine = false;

  function afficher(n) {
    if (n === affichees) return;
    affichees = n;
    visible.textContent = lettres.slice(0, n).join('');
    reserve.textContent = lettres.slice(n).join('');
  }

  function etape(t) {
    if (debut === null) debut = t;
    const ecoule = t - debut;
    const n = Math.min(lettres.length, Math.floor((ecoule * vitesse) / 1000));
    afficher(n);
    if (n >= lettres.length) return finir();
    surBouche(Math.floor(ecoule / alternanceMs) % 2 === 1);
    idFrame = requestAnimationFrame(etape);
  }

  function finir() {
    termine = true;
    cancelAnimationFrame(idFrame);
    afficher(lettres.length);
    surBouche(false);
  }

  afficher(0);
  idFrame = requestAnimationFrame(etape);

  return {
    estTermine: () => termine,
    terminer: finir,
    arreter: () => cancelAnimationFrame(idFrame),
  };
}
