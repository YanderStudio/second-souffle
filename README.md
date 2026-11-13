# Second Souffle

Mini-jeu web au format téléphone portrait, conçu pour l'exposition Nausicaá × Emmaüs Connect sur la pollution liée aux appareils électroniques (projet étudiant BUT MMI).

Le joueur fait glisser un filet pour ramasser les polluants qui tombent, sans toucher les poissons. Cinq QR codes, répartis dans l'exposition, débloquent chacun un polluant présenté par un personnage. Le classement est commun à tous les joueurs.

- **Front** : HTML, CSS et JavaScript (modules ES), sans framework ; jeu dessiné dans un `<canvas>` ; Vite sert uniquement à lancer et construire le projet.
- **Back** : API PHP 8 (PDO) et MySQL, servis par WampServer.
- **Dépendance d'exécution** : `barcode-detector` (lecture des QR codes quand le navigateur ne sait pas le faire seul, fichiers servis en local).

## Installation

Prérequis : WampServer (Apache, PHP 8, MySQL) et Node.js.

1. Placer le projet dans `C:\wamp64\www\second-souffle\` et démarrer WampServer.
2. Créer la base : dans phpMyAdmin, importer `api/schema.sql` (crée la base `second_souffle` et ses tables).
3. Copier `api/config.example.php` en `api/config.php`, puis le remplir :
   - connexion MySQL (par défaut sous Wamp : `root`, sans mot de passe) ;
   - les **codes des cinq QR codes** imprimés (`'CODE' => 'p1'`, etc.) ;
   - `sel_ip` : un texte aléatoire quelconque.

   `api/config.php` est hors git : c'est le **seul** endroit où figurent les codes, jamais dans le JavaScript.
4. Installer les dépendances : `npm install`.

## Lancer

| Usage | Commande | Adresse |
| --- | --- | --- |
| Développement et démonstration | `npm run dev` | http://localhost:5173 |
| Version construite, installable (PWA) | `npm run build` puis `npm run preview` | http://localhost:4173 |

WampServer doit être démarré : Vite redirige les appels `/api/...` vers `http://localhost/second-souffle/api/`.

Sur PC, le jeu s'affiche dans une colonne centrée au format téléphone. Pour l'installer comme une application : `npm run preview`, ouvrir l'adresse dans Chrome, puis l'icône d'installation de la barre d'adresse. Après une modification, refaire `npm run build` ; si une ancienne image reste affichée dans l'application installée, changer `VERSION` en haut de `public/sw.js`.

**Bouton « Réinitialiser les QR codes »** (en haut de l'accueil) : oublie, sur ce navigateur, les QR codes scannés et le tutoriel, pour rejouer le parcours depuis le début (utile en présentation). Le classement n'est pas touché. Pour le masquer : `BOUTON_REINITIALISER = false` en haut de `src/screens/home.js`.

## Tests de l'API

```bash
bash tests/api.sh
```

Le script (Git Bash) couvre cas valides, injection SQL, pseudo avec balises ou mot interdit, score impossible, jeton réutilisé, code faux, `p1` manquant, rafale et classement par pseudo. Il lit les codes dans `api/config.php` et crée des joueurs et parties de test (pseudos « Test… ») : à effacer ensuite de la base si besoin.

## Modifier le contenu

| Quoi | Où |
| --- | --- |
| Textes de l'interface, des bulles d'explication et du tutoriel, messages d'erreur | `src/data/textes.json` |
| Prénoms des personnages, vitesse d'écriture des bulles (`vitesseLettres`, lettres/s) | `src/data/textes.json` |
| Nom, texte de la fiche, image et **points** de chaque polluant | `src/data/polluants.json` |
| Codes des QR codes | `api/config.php` uniquement |
| Mots interdits / mots autorisés dans les pseudos | `api/lib/mots-interdits.txt`, `api/lib/mots-autorises.txt` |

**Barème** : les points de `polluants.json` sont lus à la fois par le jeu et par le serveur, qui recalcule toujours le score lui-même. Changer un nombre dans ce fichier suffit.

**Réglages du jeu** : tout est dans `src/game/config.js` (vitesse de chute de départ et maximale, intervalle entre deux polluants, score auquel la vitesse maximale est atteinte, fréquence et vitesse des poissons, tailles d'affichage, zones de collision, rail). Si `intervalleMin` change, reporter la même valeur dans `INTERVALLE_MIN` de `api/lib/jeu.php` (le serveur s'en sert pour refuser les scores impossibles).

**Classement** : dix meilleurs scores ; un même pseudo n'y apparaît qu'une fois, avec son meilleur score (comparaison exacte : majuscules et accents comptent). À égalité, le plus ancien passe devant. Pseudo : 3 à 15 lettres, chiffres, espaces ou `- _ = { } [ ] < >`.

## Remplacer les images

Remplacer un fichier en gardant son nom suffit ; si les proportions changent, ajuster la taille d'affichage dans `src/game/config.js`.

| Image | Fichier | Taille affichée |
| --- | --- | --- |
| Filet (objet du joueur) | `public/assets/images/filet.png` | `carton` dans `config.js` |
| Poisson | `public/assets/images/poisson.png` | `poisson` dans `config.js` |
| Polluants en jeu | `public/assets/polluants/*.svg` (chemins dans `polluants.json`) | `taillesPolluants` dans `config.js` |
| Polluant sur sa fiche (facultatif) | `imageFiche` dans `polluants.json` | taille réelle du SVG |
| Personnages, bouche fermée / ouverte | `public/assets/personnages/<nom>-c.png` / `-o.png` | — |
| Fond marin, corail, logo | `public/assets/images/` | — |
| Icônes de l'application | `public/assets/icons/pwa/` | — |

Pour une image en jeu, prévoir environ le double de la taille affichée (écrans haute densité), sans marge transparente autour.

## Sons

Les sons sont dans `public/assets/sons/` et déclarés en haut de `src/services/audio.js` :

| Nom | Moment | Fichiers |
| --- | --- | --- |
| `clic` | appui sur un bouton ou une bulle | `water-click.mp3`, `water-click2.mp3` (au hasard) |
| `plouf` | lancement d'une partie | `water-splash.mp3` |
| `ramassage` | polluant ramassé | aucun pour l'instant |
| `defaite` | partie perdue | aucun pour l'instant |
| `deblocage` | nouveau QR code scanné | aucun pour l'instant |

Pour ajouter un son : déposer le fichier dans `public/assets/sons/` et l'ajouter à la liste du nom voulu (plusieurs fichiers = tirage au hasard). Le volume de chaque son se règle dans `VOLUMES`. Les sons sont chargés au démarrage ; le silence au début d'un fichier est sauté automatiquement.

**Musique de fond** : `musique-nautilus.mp3`, en boucle dès le premier appui sur l'écran, coupée quand l'application passe en arrière-plan. Fichier et volume en haut de `src/services/musique.js` (`FICHIER`, `VOLUME`). Elle est lue au fil de l'eau, pas décodée d'avance comme les autres sons (fichier long).

**Voix des personnages** (« blabla » pendant l'écriture des bulles) : trois petits sons par personnage, listés dans `voix` de chaque personnage dans `textes.json` (fichiers dans `public/assets/sons/voix/`). Un son toutes les `voixLettresParSon` lettres ; volume dans `VOLUME_VOIX` de `audio.js`. Préférer des fichiers WAV 16 bits ou MP3 (les WAV 32 bits flottants ne sont pas lus partout).

## Structure

```
index.html  vite.config.js
public/          manifeste, service worker, images, polices, sons
src/
  main.js  router.js  parcours.js   point d'entrée, écrans, enchaînement des écrans
  screens/       accueil, bulle de dialogue, scanner, jeu, fin, classement
  game/          réglages, boucle, objets, apparitions, collisions, glisser
  services/      api.js (appels au serveur), storage.js, audio.js, camera.js
  data/          polluants.json, textes.json
  styles/        jetons de design et un fichier par écran
api/             players.php, unlocks.php, games.php, scores.php, lib/, schema.sql
tests/api.sh     tests de l'API
```

## Sécurité

Le navigateur n'est jamais cru sur parole : le serveur vérifie chaque règle.

- Requêtes SQL préparées uniquement ; entrées JSON aux types stricts, champs inconnus refusés.
- Le client n'envoie jamais son score : il envoie le nombre de polluants ramassés et le temps de jeu, le serveur calcule. Score refusé si le jeton de partie est inconnu ou déjà utilisé, si un polluant compté n'est pas débloqué, si la durée est invraisemblable ou si trop de polluants sont annoncés pour cette durée.
- Codes des QR codes connus du serveur seul ; 5 essais par minute et par joueur.
- Débit limité par joueur et par adresse IP ; pseudos filtrés (caractères et mots interdits) ; données affichées en texte, jamais en HTML.
- `config.php`, `lib/` et `schema.sql` inaccessibles depuis le navigateur.

**Limite assumée** : un programme qui imite une partie plausible (nombres de ramassages et durée crédibles) sera accepté. L'objectif est de bloquer les scores absurdes, les injections et les envois en rafale, pas de rendre la triche impossible.
