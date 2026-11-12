#!/bin/bash
# Renders store/icon.svg (32, 48, and 128 with 16px clear space) and store/icon-small.svg (16) to icons/ with headless Chrome.
# Uses google-chrome, the Flatpak Chrome, or $CHROME.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
work="$root/store/.work-icons"; rm -rf "$work"; mkdir -p "$work"; trap 'rm -rf "$work"' EXIT
if [ -n "${CHROME:-}" ]; then chrome=("$CHROME")
elif command -v google-chrome >/dev/null; then chrome=(google-chrome)
elif flatpak info com.google.Chrome >/dev/null 2>&1; then chrome=(flatpak run com.google.Chrome)
else echo "Chrome not found; set CHROME." >&2; exit 1; fi
render() { # svg, size, art size (the store asks for 96px art inside the 128px icon)
  local art="${3:-$2}" pad=$(( (${2} - ${3:-$2}) / 2 ))
  printf '<!doctype html><style>html,body{margin:0;background:transparent}img{display:block;width:%spx;height:%spx;margin:%spx}</style><img src="%s">' \
    "$art" "$art" "$pad" "file://$root/store/$1" > "$work/i$2.html"
  "${chrome[@]}" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 \
    --user-data-dir="$work/p$2" --window-size="$2,$2" --allow-file-access-from-files \
    --screenshot="$root/icons/icon$2.png" "file://$work/i$2.html" >/dev/null 2>&1
  echo "icons/icon$2.png"
}
render icon-small.svg 16
render icon.svg 32
render icon.svg 48
render icon.svg 128 96
