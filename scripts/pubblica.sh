#!/bin/bash
# Pubblica le modifiche correnti su truedesign.app.
# Uso: ./scripts/pubblica.sh ["messaggio di commit opzionale"]
#
# Fa commit di tutte le modifiche presenti e le pusha su main.
# Vercel rileva il push e fa il deploy automaticamente (circa 1 minuto).

set -e

cd "$(dirname "$0")/.."

if [ -z "$(git status --porcelain)" ]; then
  echo "Nessuna modifica da pubblicare."
  exit 0
fi

MESSAGE="${1:-Aggiornamento app}"

git add -A
git commit -m "$MESSAGE"
git push origin main

echo ""
echo "Pubblicato. Il deploy su Vercel parte automaticamente, di solito pronto in 1-2 minuti."
echo "Verifica su: https://vercel.com/true-design/truedesign-app/deployments"
