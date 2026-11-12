// Sons du jeu. Ajouter un son : déposer le fichier dans public/assets/sons/ et l'indiquer ici.
// Plusieurs fichiers pour un même nom : l'un d'eux est tiré au hasard à chaque fois.
// Appels placés : 'clic' (boutons et dialogues), 'plouf' (bouton Jouer),
// 'ramassage', 'defaite', 'deblocage' (encore muets : aucun fichier).
const SONS = {
  clic: ['/assets/sons/water-click.mp3', '/assets/sons/water-click2.mp3'],
  plouf: ['/assets/sons/water-splash.mp3'],
  ramassage: [],
  defaite: [],
  deblocage: [],
};

// Un lecteur par fichier, créé au chargement pour que le premier son parte sans délai
const lecteurs = new Map(
  Object.values(SONS)
    .flat()
    .map((src) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      return [src, audio];
    }),
);

/** Joue le son nommé ; ne fait rien s'il n'a pas de fichier. Un son relancé repart du début. */
export function play(nom) {
  const fichiers = SONS[nom] ?? [];
  if (!fichiers.length) return;
  const audio = lecteurs.get(fichiers[Math.floor(Math.random() * fichiers.length)]);
  audio.currentTime = 0;
  audio.play().catch(() => {}); // lecture refusée (navigateur, mode silencieux) : sans gravité
}
