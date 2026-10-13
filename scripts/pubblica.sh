#!/usr/bin/env bash
# Pubblicazione sicura di una modifica su truedesign.app.
#
# Uso:
#   ./scripts/pubblica.sh "descrizione" -- percorso/file [percorso/file ...]
#
# La pubblicazione è deliberatamente selettiva: non raccoglie mai tutte le
# modifiche del worktree. Prima del push aggiorna la base con origin/main,
# esegue i controlli e invia esattamente l'HEAD appena verificato su main.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/pubblica.sh "descrizione della modifica" -- percorso/file [percorso/file ...]

Esempio:
  ./scripts/pubblica.sh "fix: recupero password" -- src/app/login/page.tsx src/app/recupera-password

La procedura rifiuta modifiche non elencate, aggiorna il branch con origin/main,
esegue test e typecheck, poi pubblica esattamente il commit verificato.
EOF
}

fail() {
  echo "ERRORE: $*" >&2
  exit 1
}

BRANCH="$(git branch --show-current)"
[ -n "$BRANCH" ] || fail "HEAD staccato: crea o seleziona un branch di lavoro."
[ "$BRANCH" != "main" ] || fail "Non pubblicare dal branch main: usa un worktree/branch isolato."

[ "$#" -ge 3 ] || { usage >&2; exit 2; }
MESSAGE="$1"
shift
[ "$1" = "--" ] || { usage >&2; exit 2; }
shift
[ "$#" -gt 0 ] || { usage >&2; exit 2; }
ALLOWED_PATHS=("$@")

for path in "${ALLOWED_PATHS[@]}"; do
  [ -e "$path" ] || git ls-files --error-unmatch -- "$path" >/dev/null 2>&1 || fail "Percorso non trovato: $path"
done

is_allowed_path() {
  local candidate="$1"
  local allowed
  for allowed in "${ALLOWED_PATHS[@]}"; do
    case "$candidate" in
      "$allowed"|"$allowed"/*) return 0 ;;
    esac
  done
  return 1
}

assert_only_allowed_changes() {
  local candidate
  while IFS= read -r candidate; do
    [ -z "$candidate" ] && continue
    is_allowed_path "$candidate" || fail "Modifica non inclusa nella pubblicazione: $candidate. Usa un worktree pulito oppure dichiarala esplicitamente dopo averla verificata."
  done < <(
    {
      git diff --name-only
      git diff --cached --name-only
      git ls-files --others --exclude-standard
    } | sort -u
  )
}

assert_only_allowed_changes

git add -- "${ALLOWED_PATHS[@]}"
git diff --cached --quiet && fail "Nessuna modifica selezionata da pubblicare."

# Doppio controllo: nulla di estraneo deve rimanere nel worktree mentre Git
# rebasea il commit. Evita di mescolare attività diverse nello stesso deploy.
assert_only_allowed_changes
git commit -m "$MESSAGE"

if [ -n "$(git status --porcelain)" ]; then
  fail "Il worktree non è pulito dopo il commit. La pubblicazione si ferma qui per non includere lavori estranei."
fi

echo "Aggiorno la base da origin/main…"
git fetch origin main

if ! git rebase origin/main; then
  echo "Conflitto durante il rebase: annullo il rebase e non pubblico nulla." >&2
  git rebase --abort || true
  exit 1
fi

echo "Eseguo i controlli richiesti…"
npm test
npm run typecheck

COMMIT="$(git rev-parse HEAD)"
echo "Pubblico il commit verificato ${COMMIT}…"
git push origin HEAD:main

echo
echo "Pubblicato in modo verificato: ${COMMIT}"
echo "Vercel avvia ora il deploy: https://vercel.com/true-design/truedesign-app/deployments"
