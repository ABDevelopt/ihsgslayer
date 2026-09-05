#!/usr/bin/env bash
# ==============================================================================
# IHSG Slayer Auto-Deploy Script for Tencent Cloud Lighthouse
# Pulls latest code from GitHub, updates dependencies, builds frontend,
# and restarts backend & frontend services.
# ==============================================================================
set -e

echo "=== [$(date '+%Y-%m-%d %H:%M:%S')] Starting Auto-Deploy ==="

if [ -d "/var/www/ihsgslayer" ]; then
    APP_DIR="/var/www/ihsgslayer"
else
    APP_DIR="/home/ubuntu/ihsgslayer"
fi
cd "$APP_DIR"

# 1. Fetch & Reset to latest main from GitHub
echo "--> [1/4] Pulling latest changes from git origin/main..."
git fetch origin main
git reset --hard origin/main

# 2. Update Python dependencies & restart FastAPI backend
echo "--> [2/4] Updating backend virtual environment..."
if [ -d "venv" ]; then
    source venv/bin/activate
    pip install -r requirements.txt --quiet
fi

echo "--> Restarting ihsgslayer-backend service..."
sudo systemctl restart ihsgslayer-backend

# 3. Update Frontend dependencies & Build
echo "--> [3/4] Building Next.js frontend..."
cd "$APP_DIR/frontend"
npm install --prefer-offline --no-audit
npm run build

echo "--> Restarting ihsgslayer-frontend PM2 process..."
pm2 restart ihsgslayer-frontend || pm2 start npm --name "ihsgslayer-frontend" -- start -- -p 3300

# 4. Verify deployment health
echo "--> [4/4] Verifying services health..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/v1/health || true)
echo "Backend Health Status: HTTP $HTTP_STATUS"

echo "=== [$(date '+%Y-%m-%d %H:%M:%S')] Auto-Deploy Completed Successfully! ==="
