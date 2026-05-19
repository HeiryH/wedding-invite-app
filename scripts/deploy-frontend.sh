#!/usr/bin/env bash
# Deploy app to VPS (frontend always; backend when backend/ files changed).
# Usage: bash scripts/deploy-frontend.sh ["commit message"]
# Password: set VPS_PASS in your shell session once (export VPS_PASS='...'),
# or the script will prompt you each time.

set -e

BRANCH="frontend-design-fix"
VPS_HOST="139.180.154.175"
VPS_USER="root"
VPS_PATH="/opt/wedding-app"
MSG="${1:-style: design tweaks}"

# Prompt for password if not already in environment
if [[ -z "$VPS_PASS" ]]; then
  read -r -s -p "VPS password: " VPS_PASS
  echo
fi

# Commit + push (stage both frontend and backend)
git add frontend/ backend/
if git diff --cached --quiet; then
  echo "Nothing staged — skipping commit."
else
  git commit -m "$MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
fi
git push origin "$BRANCH"

# Deploy on VPS via expect (env vars prevent special chars in password from being mangled)
export VPS_HOST VPS_USER VPS_PATH VPS_PASS BRANCH
expect << 'EXPECT_SCRIPT'
set timeout 240
spawn ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 $env(VPS_USER)@$env(VPS_HOST)
expect "password:"
send "$env(VPS_PASS)\r"
expect "# "
send "cd $env(VPS_PATH) && git pull origin $env(BRANCH) 2>&1\r"
expect "# "
send "if git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -q '^backend/'; then docker compose build backend 2>&1 | tail -3 && docker compose up -d backend 2>&1; fi\r"
expect -timeout 120 "# "
send "docker compose build frontend 2>&1 | tail -5\r"
expect -timeout 200 "# "
send "docker compose up -d frontend 2>&1\r"
expect "# "
send "exit\r"
expect eof
EXPECT_SCRIPT

echo "Done — live on VPS."
