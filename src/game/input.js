// Entrée : le carton suit la position X du pointeur (souris et tactile, Pointer Events)
import { CONFIG } from './config.js';

/**
 * Écoute les glissements sur l'élément ; surX reçoit x en pixels de maquette.
 * surAppui est appelé à chaque nouvel appui (sert à reprendre après une pause).
 * Renvoie une fonction qui retire les écouteurs.
 */
export function suivrePointeur(element, surX, surAppui) {
  let actif = false;

  const versMaquette = (e) => {
    const rect = element.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * CONFIG.largeur;
  };

  const appui = (e) => {
    if (e.button > 0) return;
    actif = true;
    // Capture : le glissement continue même si le doigt sort de l'écran (peut échouer sans gravité)
    try {
      element.setPointerCapture(e.pointerId);
    } catch {
      /* pointeur déjà relâché */
    }
    surAppui();
    surX(versMaquette(e));
  };
  const deplacement = (e) => {
    if (actif) surX(versMaquette(e));
  };
  const fin = () => {
    actif = false;
  };

  element.addEventListener('pointerdown', appui);
  element.addEventListener('pointermove', deplacement);
  element.addEventListener('pointerup', fin);
  element.addEventListener('pointercancel', fin);

  return () => {
    element.removeEventListener('pointerdown', appui);
    element.removeEventListener('pointermove', deplacement);
    element.removeEventListener('pointerup', fin);
    element.removeEventListener('pointercancel', fin);
  };
}
