// Point d'entrée : styles, enregistrement des écrans, premier affichage
import './styles/tokens.css';
import './styles/base.css';
import { initialiser, enregistrer, aller } from './router.js';
import * as accueil from './screens/home.js';

initialiser(document.getElementById('ecran'));
enregistrer('accueil', accueil);
aller('accueil');
