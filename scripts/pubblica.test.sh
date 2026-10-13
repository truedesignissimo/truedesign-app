#!/usr/bin/env bash
# Test di regressione per la pipeline di pubblicazione.
# Non esegue deploy: controlla i guardrail che impediscono push incoerenti.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$ROOT/scripts/pubblica.sh"

require() {
  if ! grep -Fq -- "$1" "$SCRIPT"; then
    echo "FAIL: guardrail mancante: $1" >&2
    exit 1
  fi
}

forbid() {
  if grep -Fq -- "$1" "$SCRIPT"; then
    echo "FAIL: istruzione non sicura rilevata: $1" >&2
    exit 1
  fi
}

require 'git fetch origin main'
require 'git rebase origin/main'
require 'git push origin HEAD:main'
require 'npm test'
require 'npm run typecheck'
require 'git status --porcelain'
require '${COMMIT}'
require 'Usage:'
forbid 'git add -A'
forbid 'git push origin main'

echo "OK: i guardrail della pipeline di pubblicazione sono presenti."
