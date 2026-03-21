# AWS EC2 Deployment Guide (RazoWild)

This guide deploys Razowild to one EC2 host with three public subdomains:

- `https://www.yourdomain.com` -> storefront frontend
- `https://admin.yourdomain.com` -> admin frontend
- `https://api.yourdomain.com` -> backend API

It uses:

- EC2 (Ubuntu 22.04)
- RDS MySQL (recommended) or external MySQL
- PM2 for process management
- Nginx for reverse proxy + TLS

## Free Tier profile (cost-minimized)

This project can run on AWS free tier for light traffic, with constraints.

- EC2: `t3.micro` (or free-tier eligible equivalent in your region/account)
- RDS: `db.t3.micro` MySQL (single-AZ)
- No ALB, no NAT Gateway, no CloudFront during free-tier period
- Keep to one instance and one database

Notes:

- AWS free tier eligibility and limits can change; verify in AWS Billing before provisioning.
- Route53 hosted zones and domain registration are not usually free.
- After the 12-month free-tier window, normal charges apply.

## 1) AWS Infrastructure

## 1.1 Create EC2

Recommended minimum:

- Instance type: `t3.small` (or `t3.medium` for higher traffic)
- Disk: 30 GB gp3
- OS: Ubuntu Server 22.04 LTS

Free-tier option:

- Instance type: `t3.micro`
- Disk: keep root EBS within your free-tier allowance
- Single instance only

Security Group inbound rules:

- `22/tcp` from your office/home IP only
- `80/tcp` from `0.0.0.0/0`
- `443/tcp` from `0.0.0.0/0`

## 1.2 Create database

Preferred: Amazon RDS MySQL 8.0 in a private subnet.

- Allow EC2 security group to connect on `3306`
- Enable automated backups
- Keep DB publicly inaccessible

Free-tier option:

- Use a single `db.t3.micro` instance
- Keep allocated storage and backups within free-tier limits
- Keep single-AZ (Multi-AZ is not free-tier)

## 1.3 DNS records

Create records in Route53 (or your DNS provider):

- `www` -> EC2 public IP or ALB
- `admin` -> EC2 public IP or ALB
- `api` -> EC2 public IP or ALB

### Razowild DNS example

For `razowild.com`, create:

- `A` record: `razowild.com` -> EC2 public IP (or ALB)
- `A` record: `www.razowild.com` -> EC2 public IP (or ALB)
- `A`/`CNAME` record: `admin.razowild.com` -> same target
- `A`/`CNAME` record: `api.razowild.com` -> same target

The provided Nginx config in `deploy/nginx/razowild.conf` enforces:

- HTTP -> HTTPS for all hostnames
- `https://razowild.com` -> `https://www.razowild.com`

## 2) Bootstrap server

SSH into EC2 and run:

```bash
chmod +x /var/www/razowild/deploy/scripts/ec2-bootstrap.sh
/var/www/razowild/deploy/scripts/ec2-bootstrap.sh
```

If repo is not present yet:

```bash
git clone https://github.com/rehrazo/razowild.git /var/www/razowild
cd /var/www/razowild
chmod +x deploy/scripts/ec2-bootstrap.sh
./deploy/scripts/ec2-bootstrap.sh
```

## 3) Configure environment variables

Create `backend/.env` from root `.env.example`:

```bash
cp /var/www/razowild/.env.example /var/www/razowild/backend/.env
nano /var/www/razowild/backend/.env
```

Set production values (required):

- `NODE_ENV=production`
- `PORT=4000`
- `DB_HOST=<rds-endpoint>`
- `DB_USER=<db-user>`
- `DB_PASSWORD=<db-password>`
- `DB_NAME=razowild_db`
- `JWT_SECRET=<long-random-secret>`
- `JWT_EXPIRE=7d`
- `ADMIN_EMAILS=<comma-separated-admin-emails>`
- `ADMIN_API_TOKEN=<long-random-token>`
- `FRONTEND_URL=https://www.yourdomain.com`
- `STRIPE_SECRET_KEY=<stripe-secret>`
- `STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>`
- `SMTP_HOST=<smtp-host>`
- `SMTP_USER=<smtp-user>`
- `SMTP_PASS=<smtp-pass>`

Create frontend env:

```bash
cp /var/www/razowild/frontend/.env.example /var/www/razowild/frontend/.env.production
nano /var/www/razowild/frontend/.env.production
```

Set:

- `VITE_API_BASE_URL=https://api.yourdomain.com`
- `VITE_ADMIN_API_TOKEN=<same as backend ADMIN_API_TOKEN if token mode is used>`

## 4) Build + run app

```bash
cd /var/www/razowild
npm --prefix frontend run build
pm2 start /var/www/razowild/deploy/pm2/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Confirm local services:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:3001
curl -s http://127.0.0.1:4000/api/health
pm2 status
```

## 5) Configure Nginx

```bash
sudo cp /var/www/razowild/deploy/nginx/razowild.conf /etc/nginx/sites-available/razowild.conf
sudo ln -sf /etc/nginx/sites-available/razowild.conf /etc/nginx/sites-enabled/razowild.conf
sudo nginx -t
sudo systemctl reload nginx
```

Issue TLS certs (Let’s Encrypt):

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.yourdomain.com -d admin.yourdomain.com -d api.yourdomain.com
```

For `razowild.com`, run:

```bash
sudo certbot --nginx -d razowild.com -d www.razowild.com -d admin.razowild.com -d api.razowild.com
```

Auto-renew check:

```bash
sudo systemctl status certbot.timer
```

## 6) Post-deploy validation

- `https://www.yourdomain.com` loads storefront
- `https://admin.yourdomain.com` redirects `/` to `/admin`
- `https://api.yourdomain.com/api/health` returns healthy checks
- Admin login works at `/admin/login`
- Checkout reaches Stripe and returns to order confirmation page
- Product/category admin endpoints work for authenticated admin

## 7) Deploy updates

```bash
cd /var/www/razowild
git pull
npm install
npm --prefix backend install
npm --prefix frontend install
npm --prefix frontend run build
pm2 restart razowild-api razowild-storefront razowild-admin
pm2 save
```

## 8) Optional production hardening

- Add AWS WAF if behind ALB/CloudFront
- Restrict `admin.yourdomain.com` by office IP allowlist
- Add CloudWatch Agent for system and log metrics
- Add fail2ban + UFW (`allow OpenSSH`, `allow 80`, `allow 443`)
- Move secrets to AWS Systems Manager Parameter Store or AWS Secrets Manager

## 9) Cost guardrails

- Set AWS Budgets with email alerts at low thresholds (for example: 25%, 50%, 80%, 100%).
- Enable billing alerts in CloudWatch.
- Check Cost Explorer weekly during first month.
- Avoid creating ALB, NAT Gateway, extra EBS volumes, or Multi-AZ RDS unless planned.
- Delete unused snapshots, idle elastic IPs, and unattached volumes.
