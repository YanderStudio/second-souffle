// Point d'entrée : styles, enregistrement des écrans, lancement du parcours
import './styles/tokens.css';
import './styles/base.css';
import { initialiser, enregistrer } from './router.js';
import * as accueil from './screens/home.js';
import * as dialogue from './screens/dialog.js';
import * as scanner from './screens/scanner.js';
import * as jeu from './screens/game.js';
import * as fin from './screens/gameover.js';
import * as classement from './screens/scores.js';
import { versAccueil } from './parcours.js';

initialiser(document.getElementById('ecran'));
enregistrer('accueil', accueil);
enregistrer('dialogue', dialogue);
enregistrer('scanner', scanner);
enregistrer('jeu', jeu);
enregistrer('fin', fin);
enregistrer('classement', classement);

versAccueil();

// PWA : service worker en production seulement (en développement, il gênerait le rechargement de Vite)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
// Images lourdes des personnages chargées dès le lancement, sans retarder l'accueil
dialogue.prechargerPersonnages();
