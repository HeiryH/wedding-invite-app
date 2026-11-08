#!/usr/bin/env bash
# Start the local API and thumbnail renderer with one shared, ephemeral worker key.
set -euo pipefail
task_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$task_root"
if command -v lsof >/dev/null && lsof -nP -iTCP:5050 -sTCP:LISTEN >/dev/null 2>&1; then
  echo 'Stop the existing local API on port 5050, then run this script again.' >&2
  exit 1
fi
dotnet build backend/WeddingInvite.API --no-restore -m:1 -p:UseSharedCompilation=false -nodeReuse:false
capture_key="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
api_pid=''
renderer_pid=''
cleanup() {
  if [[ -n "$renderer_pid" ]]; then kill "$renderer_pid" 2>/dev/null || true; fi
  if [[ -n "$api_pid" ]]; then kill "$api_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM
ASPNETCORE_ENVIRONMENT=Development TemplateCapture__WorkerKey="$capture_key" dotnet run --project backend/WeddingInvite.API --no-build --no-launch-profile --urls http://localhost:5050 &
api_pid=$!
api_ready=false
for ((attempt = 0; attempt < 100; attempt++)); do
  if ! kill -0 "$api_pid" 2>/dev/null; then echo 'The local API did not start.' >&2; exit 1; fi
  if curl --silent --fail http://localhost:5050/api/template/7 >/dev/null; then api_ready=true; break; fi
  sleep 0.3
done
if [[ "$api_ready" != true ]]; then echo 'The local API did not become ready.' >&2; exit 1; fi
echo 'Starting the thumbnail renderer. Keep the frontend running at http://localhost:3000.'
echo 'Wait for "Template renderer connected" before capturing. Keep this terminal open.'
(
  cd frontend
  TEMPLATE_CAPTURE_WORKER_KEY="$capture_key" npm run studio:renderer -- --base http://localhost:3000 --api http://localhost:5050
) &
renderer_pid=$!
wait "$renderer_pid"
