#!/usr/bin/env bash
# Deploy frontend to VPS.
# Usage: bash scripts/deploy-frontend.sh ["commit message"]
# Reads VPS_PASS from .env.deploy in repo root (never committed).

set -e

BRANCH="frontend-design-fix"
VPS_HOST="139.180.154.175"
VPS_USER="root"
VPS_PATH="/opt/wedding-app"
MSG="${1:-style: design tweaks}"

# Load password
ENV_FILE="$(dirname "$0")/../.env.deploy"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env.deploy not found at $ENV_FILE"
  exit 1
fi
source "$ENV_FILE"

# Commit + push
git add frontend/
if git diff --cached --quiet; then
  echo "Nothing staged — skipping commit."
else
  git commit -m "$MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
fi
git push origin "$BRANCH"

# Deploy on VPS via expect
expect -c "
set timeout 240
spawn ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 ${VPS_USER}@${VPS_HOST}
expect \"password:\"
send \"${VPS_PASS}\r\"
expect \"# \"
send \"cd ${VPS_PATH} && git pull origin ${BRANCH} 2>&1\r\"
expect \"# \"
send \"docker compose build frontend 2>&1 | tail -5\r\"
expect -timeout 200 \"# \"
send \"docker compose up -d frontend 2>&1\r\"
expect \"# \"
send \"exit\r\"
expect eof
"

echo "Done — live on VPS."
