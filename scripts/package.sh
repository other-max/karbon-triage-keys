#!/bin/sh
# Zips the extension into dist/navica-keys-<version>.zip for the Chrome Web Store.
# Only the files the extension loads go in: no docs, store assets, tools or scripts.
set -e
cd "$(dirname "$0")/.."
v=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
mkdir -p dist
rm -f "dist/navica-keys-$v.zip"
zip -qr "dist/navica-keys-$v.zip" manifest.json src options icons -x '.*' '*/.*'
echo "dist/navica-keys-$v.zip"
