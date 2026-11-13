// Routeur d'écrans : la navigation ne passe pas par l'adresse.
// Chaque écran exporte { entrer(racine, params), quitter() }.

const ecrans = new Map();
let ecranActuel = null;
let racine = null;

/** Fixe l'élément dans lequel les écrans s'affichent. */
export function initialiser(element) {
  racine = element;
}

/** Déclare un écran sous un nom. */
export function enregistrer(nom, ecran) {
  ecrans.set(nom, ecran);
}

/** Quitte l'écran courant et affiche l'écran demandé. */
export function aller(nom, params = {}) {
  const suivant = ecrans.get(nom);
  if (!suivant) {
    console.warn(`Écran inconnu : ${nom}`); // nom mal écrit dans le parcours
    return;
  }
  ecranActuel?.quitter?.();
  racine.replaceChildren();
  racine.dataset.ecran = nom;
  ecranActuel = suivant;
  suivant.entrer(racine, params);
}
