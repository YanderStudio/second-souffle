// Tous les réglages du jeu. Unités : pixels de la maquette (402 de large), secondes.
// Changer une image revient à remplacer le fichier indiqué ici.

export const CONFIG = {
  // Largeur de référence de la maquette
  largeur: 402,

  // Rail orange (relevé sur « Ecran de Jeu.png ») ; y compté depuis le bas de la maquette (874)
  rail: { x1: 22, x2: 378, depuisBas: 874 - 740.5, epaisseur: 6, couleur: '#ff8639' },

  // Carton (image : filet de pêche) : centré sur le rail, il reste entre les extrémités du rail
  carton: { image: '/assets/images/filet.png', largeur: 100, hauteur: 121, xDepart: 201 },

  // Poisson qui tombe, tête en bas, facteurVitesse fois plus vite que les polluants
  poisson: { image: '/assets/images/poisson.png', largeur: 70, hauteur: 80, facteurVitesse: 1.5 },

  // Taille d'affichage des polluants en jeu (taille réelle des SVG)
  taillesPolluants: {
    p1: [56, 49],
    p2: [31, 104],
    p3: [93, 58],
    p4: [54, 54],
    p5: [32, 76],
  },

  // Zones de collision : fraction de la taille de l'image (un peu plus petites)
  reductionCollision: 0.8,

  // Vitesse de chute (px/s) et intervalle entre deux polluants (s) : ils évoluent avec le SCORE,
  // du départ jusqu'au plafond atteint à scoreVitesseMax points.
  // Progression en racine carrée : les premiers points accélèrent nettement, puis la hausse ralentit.
  vitesseDepart: 180,
  vitesseMax: 900,
  intervalleDepart: 1.4,
  intervalleMin: 0.32,
  scoreVitesseMax: 200000,
  // Temps (s) pour que la vitesse rejoigne sa nouvelle valeur après un ramassage (évite les à-coups)
  lissageVitesse: 0.8,

  // Un poisson pour environ deux polluants
  probabilitePoisson: 0.5,
  // Écart horizontal minimal entre un poisson et le polluant de la même rangée (en plus des demi-largeurs)
  margePoisson: 30,
  // Arrivée d'un poisson au rail : au plus tôt margeArriveePoisson px (de chute de polluant) après
  // le polluant précédent, au plus tard arriveePoissonMax × l'écart entre deux polluants après le sien
  // (au-delà de 0,5, il pourrait arriver en même temps que le polluant suivant)
  margeArriveePoisson: 100,
  arriveePoissonMax: 0.45,

  // Vitesse de déplacement du carton jugée faisable par un joueur (px/s) :
  // l'écart horizontal entre deux polluants successifs en tient compte
  vitesseCartonFaisable: 700,

  // Delta de temps plafonné (s) et densité de pixels maximale
  deltaMax: 0.05,
  dprMax: 2,

  // Décompte avant la reprise automatique (retour du scanner, sortie du menu pause), en secondes
  decompteReprise: 3,

  // Temps d'arrêt sur l'image avant l'écran de fin (s)
  delaiDefaite: 0.8,
};
