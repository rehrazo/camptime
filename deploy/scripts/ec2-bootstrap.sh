#!/usr/bin/env bash
set -euo pipefail

APP_USER="ubuntu"
APP_DIR="/var/www/razowild"
NODE_MAJOR="20"

echo "[1/7] Updating packages"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "[2/7] Installing system dependencies"
sudo apt-get install -y git curl unzip nginx mysql-client ufw

if ! command -v node >/dev/null 2>&1; then
  echo "[3/7] Installing Node.js ${NODE_MAJOR}.x"
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[4/7] Installing PM2"
  sudo npm install -g pm2
fi

echo "[5/7] Creating app directory"
sudo mkdir -p /var/www
sudo chown -R "$APP_USER":"$APP_USER" /var/www

if [ ! -d "$APP_DIR/.git" ]; then
  echo "[6/7] Cloning repository"
   git clone https://github.com/rehrazo/razowild.git "$APP_DIR"
else
  echo "[6/7] Repository already present, skipping clone"
fi

cd "$APP_DIR"

echo "[7/7] Installing dependencies"
npm install
npm --prefix backend install
npm --prefix frontend install

cat <<'EOF'
Bootstrap completed.

Next steps:
1) Configure backend env file:
   cp .env.example backend/.env
   nano backend/.env

2) Configure frontend env file:
   cp frontend/.env.example frontend/.env.production
   nano frontend/.env.production

3) Build frontend:
   npm --prefix frontend run build

4) Start services with PM2:
   cp deploy/pm2/ecosystem.config.cjs /var/www/razowild/ecosystem.config.cjs
   pm2 start /var/www/razowild/ecosystem.config.cjs
   pm2 save
   pm2 startup systemd -u ubuntu --hp /home/ubuntu

5) Configure Nginx:
   sudo cp deploy/nginx/razowild.conf /etc/nginx/sites-available/razowild.conf
   sudo ln -sf /etc/nginx/sites-available/razowild.conf /etc/nginx/sites-enabled/razowild.conf
   sudo nginx -t
   sudo systemctl reload nginx
EOF
