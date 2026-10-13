#!/bin/bash
# Compile l'app et remplace le site publié à la racine du dépôt.
# À lancer depuis le dossier source/ :  ./publier.sh   (puis commit + push)
set -e
cd "$(dirname "$0")"
RACINE=..
# 1. Les médias publiés (racine) servent de référence : on les recopie dans public/
for d in fonds tarot sons; do rm -rf public/$d; cp -r $RACINE/$d public/$d; done
# 2. Compilation
[ -d node_modules ] || npm install --no-audit --no-fund
npx vite build
# 3. On retire l'ancien site compilé (pas les médias), puis on pose le nouveau
rm -rf $RACINE/assets $RACINE/workbox-*.js $RACINE/sw.js $RACINE/registerSW.js $RACINE/manifest.webmanifest $RACINE/index.html
cp -r dist/assets dist/*.js dist/index.html dist/manifest.webmanifest $RACINE/
cp dist/*.png $RACINE/
echo "Site prêt à la racine. Reste : git add -A && git commit && git push"
