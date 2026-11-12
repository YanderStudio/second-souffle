#!/usr/bin/env bash
# Tests de l'API (phase 5) : cas valides, injection SQL, balises, score impossible,
# jeton réutilisé, code faux, p1 manquant, rafale. Wamp démarré, base importée.
# Usage : bash tests/api.sh [url de l'API]   (défaut : http://localhost/second-souffle/api)
# Attention : crée des joueurs et des parties de test (pseudos « Test… ») dans la base.

API="${1:-http://localhost/second-souffle/api}"
PHP="${PHP:-/c/wamp64/bin/php/php8.0.30/php.exe}"
RACINE="$(cd "$(dirname "$0")/.." && pwd)"

# Les vrais codes ne sont écrits que dans api/config.php : on les y lit (C1 = code de p1, etc.)
read -r C1 C2 C3 <<< "$(cd "$RACINE" && "$PHP" -r '$c = (require "api/config.php")["codes"]; foreach (["p1", "p2", "p3"] as $p) echo array_search($p, $c), " ";')"
[ -n "$C3" ] || { echo "Codes illisibles dans api/config.php"; exit 1; }
C1_SAISIE=" ${C1:0:3} ${C1:3} "; C1_SAISIE="${C1_SAISIE,,}" # minuscules et espaces, comme une saisie

OK=0
KO=0

# requete METHODE route [corps JSON] [type de contenu] → remplit $STATUT et $CORPS
requete() {
  local type="${4:-application/json}"
  local sortie
  if [ -n "$3" ]; then
    # corps passé par l'entrée standard : les accents restent en UTF-8 (sous Windows, les arguments sont réencodés)
    sortie=$(curl -s -w '\n%{http_code}' -X "$1" -H "Content-Type: $type" --data-binary @- "$API/$2" <<< "$3")
  else
    sortie=$(curl -s -w '\n%{http_code}' -X "$1" "$API/$2")
  fi
  STATUT="${sortie##*$'\n'}"
  CORPS="${sortie%$'\n'*}"
}

# verifier "description" statut_attendu [texte attendu dans la réponse]
verifier() {
  if [ "$STATUT" = "$2" ] && { [ -z "$3" ] || [[ "$CORPS" == *"$3"* ]]; }; then
    OK=$((OK + 1)); printf '  OK  %-58s %s\n' "$1" "$STATUT"
  else
    KO=$((KO + 1)); printf '  KO  %-58s %s (attendu %s) %s\n' "$1" "$STATUT" "$2" "$CORPS"
  fi
}

champ() { sed -n "s/.*\"$1\":\"\([0-9a-f]*\)\".*/\1/p" <<< "$CORPS"; }

nouveau_joueur() { requete POST players.php; champ player_id; }

echo "== Cas valides"
requete POST players.php; verifier "création d'un joueur" 200 player_id
J=$(champ player_id)
requete POST unlocks.php "{\"player_id\":\"$J\",\"code\":\"$C1_SAISIE\"}"; verifier "code p1 (minuscules, espaces)" 200 '"polluant_id":"p1"'
requete POST unlocks.php "{\"player_id\":\"$J\",\"code\":\"$C3\"}"; verifier "code p3 après p1" 200 '"unlocked":["p1","p3"]'
requete POST unlocks.php "{\"player_id\":\"$J\",\"code\":\"$C3\"}"; verifier "code déjà utilisé : pas d'erreur" 200 '"polluant_id":"p3"'
requete POST games.php "{\"player_id\":\"$J\"}"; verifier "début de partie" 200 game_token
T=$(champ game_token)
echo "   (attente de 4,5 s : durée minimale d'une partie)"; sleep 4.5
requete POST scores.php "{\"game_token\":\"$T\",\"pseudo\":\"  Test Élodie \",\"counts\":{\"p1\":3,\"p3\":1}}"
verifier "score calculé par le serveur (3×50 + 1000)" 200 '"score":1150'
requete GET scores.php; verifier "classement contient le pseudo (espaces retirés)" 200 '"pseudo":"Test Élodie","score":1150'

echo "== Jeton réutilisé"
requete POST scores.php "{\"game_token\":\"$T\",\"pseudo\":\"Test\",\"counts\":{\"p1\":1}}"; verifier "même jeton une 2e fois" 422

echo "== Injection SQL"
requete POST scores.php "{\"game_token\":\"$T\",\"pseudo\":\"x'; DROP TABLE games;--\",\"counts\":{}}"; verifier "pseudo avec SQL" 400
requete POST unlocks.php "{\"player_id\":\"$J\",\"code\":\"' OR 1=1 --\"}"; verifier "code avec SQL" 404
requete POST games.php "{\"player_id\":\"' OR '1'='1\"}"; verifier "player_id avec SQL" 400
requete POST scores.php "{\"game_token\":\"x' OR 1=1 #\",\"pseudo\":\"Test\",\"counts\":{}}"; verifier "jeton avec SQL" 400
requete GET scores.php; verifier "tables intactes (classement lisible)" 200 '"scores"'

echo "== Pseudo"
requete POST scores.php "{\"game_token\":\"$T\",\"pseudo\":\"<script>alert(1)</script>\",\"counts\":{}}"; verifier "pseudo avec balises" 400
requete POST scores.php "{\"game_token\":\"$T\",\"pseudo\":\"ab\",\"counts\":{}}"; verifier "pseudo trop court" 400
requete POST scores.php "{\"game_token\":\"$T\",\"pseudo\":\"Super-CONNÂRD\",\"counts\":{}}"; verifier "mot interdit (accents, majuscules, collé)" 400 refus
requete POST scores.php "{\"game_token\":\"$T\",\"pseudo\":\"Test Unique\",\"counts\":{}}"; verifier "« Unique » accepté (nique seulement en mot entier)" 422

echo "== Score impossible"
J2=$(nouveau_joueur)
requete POST unlocks.php "{\"player_id\":\"$J2\",\"code\":\"$C1\"}"
requete POST games.php "{\"player_id\":\"$J2\"}"; T2=$(champ game_token)
requete POST scores.php "{\"game_token\":\"$T2\",\"pseudo\":\"Test\",\"counts\":{\"p1\":1}}"; verifier "partie trop courte (< 4 s)" 422
requete POST games.php "{\"player_id\":\"$J2\"}"; T3=$(champ game_token)
requete POST games.php "{\"player_id\":\"$J2\"}"; T4=$(champ game_token)
sleep 4.5
requete POST scores.php "{\"game_token\":\"$T3\",\"pseudo\":\"Test\",\"counts\":{\"p1\":100000}}"; verifier "100 000 ramassages en 4 s" 422
requete POST scores.php "{\"game_token\":\"$T4\",\"pseudo\":\"Test\",\"counts\":{\"p5\":1}}"; verifier "polluant non débloqué (p5)" 422
requete POST games.php "{\"player_id\":\"$J2\"}"; T5=$(champ game_token)
requete POST scores.php "{\"game_token\":\"$T5\",\"pseudo\":\"Test\",\"counts\":{\"p1\":-1}}"; verifier "compteur négatif" 400
requete POST scores.php "{\"game_token\":\"$T5\",\"pseudo\":\"Test\",\"counts\":{\"p1\":1.5}}"; verifier "compteur décimal" 400
requete POST scores.php "{\"game_token\":\"$T5\",\"pseudo\":\"Test\",\"counts\":{\"p1\":\"3\"}}"; verifier "compteur en texte" 400
requete POST scores.php "{\"game_token\":\"$T5\",\"pseudo\":\"Test\",\"counts\":{\"p9\":1}}"; verifier "polluant inconnu" 400
requete POST scores.php "{\"game_token\":\"$T5\",\"pseudo\":\"Test\",\"counts\":{},\"score\":999999}"; verifier "score envoyé par le client : champ refusé" 400

echo "== Code faux, p1 manquant"
J3=$(nouveau_joueur)
requete POST unlocks.php "{\"player_id\":\"$J3\",\"code\":\"ZZZZZZ\"}"; verifier "code inconnu" 404 "Code inconnu"
requete POST unlocks.php "{\"player_id\":\"$J3\",\"code\":\"$C2\"}"; verifier "code p2 sans p1" 409 "premier QR code"
requete POST games.php "{\"player_id\":\"$J3\"}"; verifier "partie sans p1" 403
requete POST unlocks.php "{\"player_id\":\"0123456789abcdef0123456789abcdef\",\"code\":\"$C1\"}"; verifier "joueur inconnu" 400

echo "== Format et méthode"
requete GET players.php; verifier "méthode GET sur players" 405
requete DELETE scores.php; verifier "méthode DELETE sur scores" 405
requete POST games.php "{\"player_id\":" ; verifier "JSON invalide" 400
requete POST games.php "[\"$J\"]"; verifier "tableau au lieu d'objet" 400
requete POST games.php "{\"player_id\":\"$J\",\"admin\":true}"; verifier "champ inconnu" 400
requete POST games.php "player_id=$J" "application/x-www-form-urlencoded"; verifier "formulaire au lieu de JSON" 400
requete POST games.php "{\"player_id\":\"$J\",\"x\":\"$(head -c 3000 /dev/zero | tr '\0' 'a')\"}"; verifier "corps trop volumineux" 400

echo "== Fichiers protégés"
for f in config.php config.example.php schema.sql lib/db.php lib/mots-interdits.txt lib/; do
  requete GET "$f"; verifier "accès HTTP à $f" 403
done

echo "== En-têtes"
ENTETES=$(curl -s -D - -o /dev/null "$API/scores.php")
grep -qi '^content-type: application/json' <<< "$ENTETES" && grep -qi '^x-content-type-options: nosniff' <<< "$ENTETES" && ! grep -qi '^access-control' <<< "$ENTETES" \
  && { OK=$((OK + 1)); echo "  OK  JSON, nosniff, aucun en-tête CORS"; } || { KO=$((KO + 1)); echo "  KO  en-têtes : $ENTETES"; }

echo "== Rafale"
J4=$(nouveau_joueur)
for i in 1 2 3 4 5 6; do requete POST unlocks.php "{\"player_id\":\"$J4\",\"code\":\"FAUX0$i\"}"; done
verifier "6e code en une minute (5 essais max)" 429
for i in $(seq 1 35); do requete POST players.php; [ "$STATUT" = 429 ] && break; done
verifier "création de joueurs en rafale (plafond par IP)" 429

echo
echo "Résultat : $OK OK, $KO KO"
[ "$KO" -eq 0 ]
