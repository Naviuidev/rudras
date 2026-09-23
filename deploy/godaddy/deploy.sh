#!/usr/bin/env bash
# Build locally and upload to GoDaddy via SSH/rsync.
#
# Before first run:
#   1. cPanel → SSH Access → Generate SSH key → Authorize → copy private key to Mac
#   2. Fill in variables below
#   3. Create MySQL DB in cPanel and import database/schema.sql (+ deploy.sql if needed)
#   4. Create subdomain api.rudrasfarmfresh.in → document root: ~/rudra/backend/public
#   5. Put production values in project root .env (deploy uploads it to ~/rudra/.env)
#
# Usage:
#   chmod +x deploy/godaddy/deploy.sh
#   ./deploy/godaddy/deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# --- EDIT THESE ---
SSH_USER="YOUR_CPANEL_USERNAME"
SSH_HOST="rudrasfarmfresh.in"   # or server IP from cPanel
SSH_PORT="22"
REMOTE_RUDRA="rudra"            # ~/rudra on server (backend + .env)
# ------------------

API_URL="${VITE_PROD_API_URL:-https://api.rudrasfarmfresh.in/api}"
if [[ -f "$ROOT/.env" ]]; then
  if grep -q '^VITE_WEB_API_URL=' "$ROOT/.env" 2>/dev/null; then
    API_URL="$(grep '^VITE_WEB_API_URL=' "$ROOT/.env" | tail -1 | cut -d= -f2- | tr -d '\r' | xargs)"
  fi
fi

if [[ ! -f "$ROOT/.env" ]]; then
  echo "Missing $ROOT/.env — create it before deploy (it will be uploaded to production)."
  exit 1
fi

if [[ "$SSH_USER" == "YOUR_CPANEL_USERNAME" ]]; then
  echo "Edit SSH_USER and SSH_HOST in deploy/godaddy/deploy.sh first."
  exit 1
fi

SSH_TARGET="${SSH_USER}@${SSH_HOST}"
RSYNC_SSH="ssh -p ${SSH_PORT}"

echo "==> Building customer web (API: ${API_URL})"
cd "$ROOT/web"
npm ci
VITE_WEB_API_URL="$API_URL" npm run build

echo "==> Building admin panel"
cd "$ROOT/admin"
npm ci
VITE_API_URL="$API_URL" npm run build -- --base=/admin/

echo "==> Backend composer (local vendor for upload)"
cd "$ROOT/backend"
if command -v composer >/dev/null 2>&1; then
  composer install --no-dev --optimize-autoloader
else
  echo "Warning: composer not found locally; vendor/ must exist or run composer on server."
fi

BACKUP_TAG="backup_$(date +%Y%m%d_%H%M%S)"
echo "==> Backing up old public_html on server"
$RSYNC_SSH -p "$SSH_PORT" "$SSH_TARGET" "test -d public_html && mv public_html public_html_${BACKUP_TAG} || true; mkdir -p public_html public_html/admin"

echo "==> Uploading customer site → ~/public_html/"
rsync -avz --delete -e "$RSYNC_SSH" \
  "$ROOT/web/dist/" \
  "${SSH_TARGET}:public_html/"

echo "==> Uploading admin → ~/public_html/admin/"
rsync -avz --delete -e "$RSYNC_SSH" \
  "$ROOT/admin/dist/" \
  "${SSH_TARGET}:public_html/admin/"

echo "==> Uploading .htaccess files"
scp -P "$SSH_PORT" "$ROOT/deploy/godaddy/public_html.htaccess" "${SSH_TARGET}:public_html/.htaccess"
scp -P "$SSH_PORT" "$ROOT/deploy/godaddy/admin.htaccess" "${SSH_TARGET}:public_html/admin/.htaccess"

echo "==> Uploading .env → ~/${REMOTE_RUDRA}/.env"
$RSYNC_SSH -p "$SSH_PORT" "$SSH_TARGET" "mkdir -p ${REMOTE_RUDRA}"
scp -P "$SSH_PORT" "$ROOT/.env" "${SSH_TARGET}:${REMOTE_RUDRA}/.env"
$RSYNC_SSH -p "$SSH_PORT" "$SSH_TARGET" "chmod 600 ${REMOTE_RUDRA}/.env"

echo "==> Uploading backend → ~/${REMOTE_RUDRA}/backend/"
$RSYNC_SSH -p "$SSH_PORT" "$SSH_TARGET" "mkdir -p ${REMOTE_RUDRA}/backend"
rsync -avz --delete -e "$RSYNC_SSH" \
  --exclude 'uploads/*' \
  "$ROOT/backend/" \
  "${SSH_TARGET}:${REMOTE_RUDRA}/backend/"

$RSYNC_SSH -p "$SSH_PORT" "$SSH_TARGET" "mkdir -p ${REMOTE_RUDRA}/backend/uploads && touch ${REMOTE_RUDRA}/backend/uploads/.gitkeep"

echo ""
echo "Done. Verify:"
echo "  https://rudrasfarmfresh.in"
echo "  https://rudrasfarmfresh.in/admin/login"
echo "  https://api.rudrasfarmfresh.in/api/products"
echo ""
echo "If API fails: set subdomain api → document root ~/rudra/backend/public in cPanel."
