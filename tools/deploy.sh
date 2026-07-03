#!/usr/bin/env bash
# tools/deploy.sh ["commit message"] — the whole ship-it ritual in one command:
# validate ids, type-check, commit (if a message is given and there are changes),
# push to GitHub, deploy to Railway, wait for the verdict, probe the live site.
set -euo pipefail
cd "$(dirname "$0")/.."

node tools/validate-ids.mjs
npx tsc --noEmit

if [ -n "${1:-}" ] && [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "$1"
fi
git push

railway up --service zork-ui --detach

status() {
  railway status --json 2>/dev/null | python3 -c "import json,sys; j=json.load(sys.stdin); print(j['environments']['edges'][0]['node']['serviceInstances']['edges'][0]['node']['latestDeployment']['status'])" 2>/dev/null
}
until s=$(status); [ -n "$s" ] && [ "$s" != "BUILDING" ] && [ "$s" != "DEPLOYING" ] && [ "$s" != "INITIALIZING" ]; do
  sleep 15
done
echo "deploy: $s"
[ "$s" = "SUCCESS" ] || exit 1
sleep 5
curl -s -o /dev/null -w "probe: %{http_code} in %{time_total}s\n" --max-time 30 https://zork-ui-production.up.railway.app/
