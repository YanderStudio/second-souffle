// Bulle de dialogue (Explication, Tutoriel, Fiche polluant) :
// personnage qui « parle », texte écrit lettre par lettre, flèche pour continuer.
import { creer, image, auToucher } from './ui.js';
import { ecrireLettreParLettre } from './typewriter.js';
import textes from '../data/textes.json';
import '../styles/dialog.css';

let arreter = null;

/**
 * params : { personnage, texte, polluantImage?, suivant }
 *  - personnage : id dans textes.json (pull-creme, polo-gris, salopette)
 *  - polluantImage : facultatif, affiche la variante avec image
 *  - suivant : appelé quand le joueur passe à l'écran suivant
 */
export function entrer(racine, params) {
  const perso = textes.personnages[params.personnage];
  const ecran = creer('section', `ecran ecran-dialogue perso-${params.personnage}`);

  // Deux images superposées : bouche fermée (_c) et ouverte (_o)
  const boucheFermee = image(`${perso.bouche}-c.png`, 'perso perso--ferme');
  const boucheOuverte = image(`${perso.bouche}-o.png`, 'perso perso--ouvert');

  const bulle = creer('div', params.polluantImage ? 'bulle bulle--polluant' : 'bulle');
  // Nom de famille affiché ou non selon textes.json (afficherNomFamille)
  const nomAffiche = textes.afficherNomFamille ? `${perso.prenom} ${perso.nomFamille}` : perso.prenom;
  const nom = creer('p', 'bulle__nom titre', nomAffiche);
  const texte = creer('p', 'bulle__texte');
  const fleche = creer('button', 'bulle__fleche');
  fleche.type = 'button';
  fleche.setAttribute('aria-label', 'Continuer');
  fleche.append(image('/assets/icons/bouton-jouer.svg'));

  if (params.polluantImage) {
    const img = image(params.polluantImage, 'bulle__polluant');
    // Taille réelle du SVG convertie en unités maquette (remplacer le fichier suffit)
    img.addEventListener('load', () => img.style.setProperty('--l', img.naturalWidth));
    bulle.append(img);
  }
  bulle.append(nom, texte, fleche);
  ecran.append(boucheFermee, boucheOuverte, bulle, image('/assets/images/corail.png', 'corail corail--bulle'));
  racine.append(ecran);

  // Alternance des bouches pendant l'écriture
  const parle = (ouverte) => ecran.classList.toggle('parle', ouverte);
  const ecriture = ecrireLettreParLettre(texte, params.texte, {
    vitesse: textes.vitesseLettres,
    alternanceMs: textes.alternanceBoucheMs,
    surBouche: parle,
  });
  arreter = ecriture.arreter;

  // Toucher : termine le texte, puis passe à l'écran suivant
  auToucher(ecran, () => {
    if (!ecriture.estTermine()) ecriture.terminer();
    else params.suivant();
  });
}

export function quitter() {
  arreter?.();
  arreter = null;
}
