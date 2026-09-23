# Deploy to GoDaddy (rudrasfarmfresh.in)

This project is **not** a single PHP site: it is **customer web + admin + PHP API + MySQL**. On GoDaddy/cPanel you deploy **built files** from your Mac via **SSH**, not `git pull` inside `public_html` alone.

## Architecture on the server

| URL | What |
|-----|------|
| `https://rudrasfarmfresh.in` | Customer web (`web/dist` → `public_html/`) |
| `https://rudrasfarmfresh.in/admin/login` | Admin (`admin/dist` → `public_html/admin/`) |
| `https://api.rudrasfarmfresh.in/api/...` | PHP API (`backend/public` as subdomain doc root) |

## One-time cPanel setup

### 1. SSH key (your screenshot)

1. cPanel → **SSH Access** → **Generate a New Key** (RSA, no passphrase is OK).
2. **Manage** → **Authorize** the public key.
3. On your Mac, add the private key or use cPanel’s “View/Download” and:
   ```bash
   chmod 600 ~/.ssh/godaddy_rudra
   ssh -i ~/.ssh/godaddy_rudra YOUR_CPANEL_USER@rudrasfarmfresh.in
   ```

### 2. MySQL

1. cPanel → **MySQL® Databases** → create database + user → assign **ALL PRIVILEGES**.
2. **phpMyAdmin** → Import:
   - `database/schema.sql`
   - If needed: `database/deploy.sql`
3. Put **production** settings in your local project root **`.env`** (DB host/name/user from cPanel, `VITE_WEB_API_URL=https://api.rudrasfarmfresh.in/api`, etc.). Each deploy **uploads this file** to `~/rudra/.env`.

### 3. API subdomain

1. cPanel → **Domains** → **Subdomains** → create **`api`** → `api.rudrasfarmfresh.in`.
2. Set document root to: **`rudra/backend/public`** (full path like `/home/USER/rudra/backend/public`).
3. Ensure `backend/public/.htaccess` is present (included in repo).

### 4. PHP version

cPanel → **Select PHP Version** → **8.1+** for the account. Enable extensions: `pdo_mysql`, `curl`, `mbstring`, `json`.

### 5. Composer on server (first time only)

SSH in:

```bash
cd ~/rudra/backend
curl -sS https://getcomposer.org/installer | php
php composer.phar install --no-dev --optimize-autoloader
mkdir -p uploads && chmod 755 uploads
```

## Deploy from your Mac (replace old public_html)

1. Edit `deploy/godaddy/deploy.sh` → set `SSH_USER`, `SSH_HOST`.
2. Run:

```bash
cd /Users/naveenreddy/Desktop/NaveenHosur/projects/rudra
chmod +x deploy/godaddy/deploy.sh
./deploy/godaddy/deploy.sh
```

This will:

- Build web + admin with production API URL
- Rename current `public_html` to `public_html_backup_YYYYMMDD_HHMMSS`
- Upload new customer site and admin
- Upload **`~/rudra/.env`** from your local `.env` (overwrites server copy each deploy)
- Upload backend to `~/rudra/backend/`

## Manual commands (if you prefer step by step)

```bash
# From project root on your Mac
export API_URL="https://api.rudrasfarmfresh.in/api"
export SSH="YOUR_CPANEL_USER@rudrasfarmfresh.in"

cd web && npm ci && VITE_WEB_API_URL="$API_URL" npm run build
cd ../admin && npm ci && VITE_API_URL="$API_URL" npm run build -- --base=/admin/
cd ../backend && composer install --no-dev --optimize-autoloader

# Backup & clear public site
ssh $SSH 'mv public_html public_html_backup_$(date +%Y%m%d) 2>/dev/null; mkdir -p public_html public_html/admin'

# Upload
rsync -avz --delete web/dist/ $SSH:public_html/
rsync -avz --delete admin/dist/ $SSH:public_html/admin/
scp deploy/godaddy/public_html.htaccess $SSH:public_html/.htaccess
scp deploy/godaddy/admin.htaccess $SSH:public_html/admin/.htaccess
ssh $SSH 'mkdir -p rudra && chmod 700 rudra'
scp .env $SSH:rudra/.env
ssh $SSH 'chmod 600 rudra/.env'
rsync -avz --delete --exclude 'uploads/*' backend/ $SSH:rudra/backend/
```

## After deploy

- Test: https://rudrasfarmfresh.in  
- Admin: https://rudrasfarmfresh.in/admin/login  
- API: https://api.rudrasfarmfresh.in/api/products  
- Mobile app: set `EXPO_PUBLIC_API_URL=https://api.rudrasfarmfresh.in/api` and rebuild.

## GitHub

Push source code to [github.com/Naviuidev/rudras](https://github.com/Naviuidev/rudras.git). Keep `.env` out of Git (`.gitignore`) — production gets `.env` only via **deploy/rsync**, not from the repo.

## `.env` only (quick upload)

If you only changed config and do not need a full rebuild:

```bash
export SSH="YOUR_CPANEL_USER@rudrasfarmfresh.in"
scp /Users/naveenreddy/Desktop/NaveenHosur/projects/rudra/.env $SSH:rudra/.env
ssh $SSH 'chmod 600 rudra/.env'
```

## Restore old site

```bash
ssh YOUR_USER@rudrasfarmfresh.in 'rm -rf public_html && mv public_html_backup_YYYYMMDD public_html'
```

Replace `YYYYMMDD` with your backup folder name from deploy.
