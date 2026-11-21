#!/bin/sh
# Lance les tests de bout en bout (Playwright + Chromium) sur l'application.
# Usage : sh tests/run.sh [nom-du-test ...]   (sans argument : tous les tests)
# Les captures d'écran et fichiers produits vont dans tests/output/.
cd "$(dirname "$0")/.." || exit 1
OUT="$(pwd)/tests/output"
mkdir -p "$OUT"
PORT=8123

python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null' EXIT INT TERM
sleep 1
python3 tests/build-preview.py "$OUT/preview.html" >/dev/null

# nom|commande
TESTS="basics|node tests/basics.test.js $OUT
migration|node tests/migration.test.js $OUT
splash|node tests/splash.test.js $OUT
day|node tests/day.test.js $OUT
debts|node tests/debts.test.js $OUT
reminder|node tests/reminder.test.js $OUT
stock-report|node tests/stock-report.test.js $OUT .
onboarding-auth|node tests/onboarding-auth.test.js tests $OUT
consent|node tests/consent.test.js tests $OUT
sync|node tests/sync.test.js tests $OUT
slider|node tests/slider.test.js tests $OUT
pos-invoices|node tests/pos-invoices.test.js $OUT/preview.html $OUT
debts-search|node tests/debts-search.test.js $OUT/preview.html $OUT
desktop|node tests/desktop.test.js $OUT/preview.html $OUT"

failed=0
echo "$TESTS" | while IFS='|' read -r name cmd; do
  if [ $# -gt 0 ]; then
    case " $* " in *" $name "*) ;; *) continue ;; esac
  fi
  log="$OUT/$name.log"
  if timeout 180 sh -c "$cmd" >"$log" 2>&1 && tail -n 1 "$log" | grep -q "no errors"; then
    echo "OK     $name"
  else
    echo "ÉCHEC  $name (voir $log)"
    tail -n 5 "$log" | sed 's/^/       /'
    echo 1 > "$OUT/.failed"
  fi
done
[ -f "$OUT/.failed" ] && { rm -f "$OUT/.failed"; exit 1; }
exit 0
