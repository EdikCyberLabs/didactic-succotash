#!/bin/sh
# Copie les fichiers de l'application web dans www/, le dossier embarqué dans l'application Android.
set -e
cd "$(dirname "$0")/.."
rm -rf www
mkdir -p www
cp -R index.html manifest.webmanifest sw.js css js vendor fonts icons www/
echo "www/ prêt ($(find www -type f | wc -l) fichiers)"
