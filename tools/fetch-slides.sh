#!/usr/bin/env bash
# Re-export every deck in src/_data/decks.yml from Google Slides as PNGs.
#
# The slides are committed, so the site builds with no network and the viewer
# has nothing to fetch at runtime. Run this after editing a deck.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 - <<'PY' | while read -r name count url; do
import re, io
txt = io.open('src/_data/decks.yml', encoding='utf-8').read()
for block in re.split(r'\n(?=- )', txt):
    n = re.search(r'name:\s*(\S+)', block)
    c = re.search(r'count:\s*(\d+)', block)
    u = re.search(r'source:\s*"([^"]+)"', block)
    if n and c and u:
        print(n.group(1), c.group(1), u.group(1))
PY
  id=$(printf '%s' "$url" | sed -n 's#.*/presentation/d/\([^/]*\)/.*#\1#p')
  echo "$name: $count slides from $id"
  mkdir -p "src/assets/slides/$name"
  for i in $(seq 1 "$count"); do
    out=$(printf 'src/assets/slides/%s/%02d.png' "$name" "$i")
    curl -sSfL -o "$out" \
      "https://docs.google.com/presentation/d/$id/export/png?pageid=p$i"
    echo "  $out"
  done
done
