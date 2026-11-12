// Tous les réglages du jeu. Unités : pixels de la maquette (402 de large), secondes.
// Changer une image revient à remplacer le fichier indiqué ici.

export const CONFIG = {
  // Largeur de référence de la maquette
  largeur: 402,

  // Rail orange (relevé sur « Ecran de Jeu.png ») ; y compté depuis le bas de la maquette (874)
  rail: { x1: 22, x2: 378, depuisBas: 874 - 740.5, epaisseur: 6, couleur: '#ff8639' },

  // Carton : centré sur le rail, il reste entre les extrémités du rail
  carton: { image: '/assets/images/carton.png', largeur: 100, hauteur: 50, xDepart: 201 },

  // Poisson (placeholder remplaçable)
  poisson: { image: '/assets/images/poisson.png', largeur: 100, hauteur: 50 },

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

  // Vitesse de chute (px/s) et intervalle entre deux polluants (s),
  // du départ jusqu'au plafond atteint après dureeAcceleration secondes de jeu
  vitesseDepart: 180,
  vitesseMax: 420,
  intervalleDepart: 1.4,
  intervalleMin: 0.55,
  dureeAcceleration: 120,

  // Un poisson pour environ quatre polluants
  probabilitePoisson: 0.25,
  // Écart horizontal minimal entre un poisson et le polluant de la même rangée (en plus des demi-largeurs)
  margePoisson: 30,

  // Vitesse de déplacement du carton jugée faisable par un joueur (px/s) :
  // l'écart horizontal entre deux polluants successifs en tient compte
  vitesseCartonFaisable: 700,

  // Delta de temps plafonné (s) et densité de pixels maximale
  deltaMax: 0.05,
  dprMax: 2,

  // Temps d'arrêt sur l'image avant l'écran de fin (s)
  delaiDefaite: 0.8,
};
