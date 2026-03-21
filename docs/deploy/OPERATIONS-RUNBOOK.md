# Operations Runbook (EC2)

## Common commands

```bash
cd /var/www/razowild
pm2 status
pm2 logs razowild-api --lines 200
pm2 logs razowild-storefront --lines 200
pm2 logs razowild-admin --lines 200
sudo systemctl status nginx
sudo tail -n 200 /var/log/nginx/error.log
curl -s http://127.0.0.1:4000/api/health
```

## Restart sequence

Use this order to minimize user impact:

1. `npm --prefix frontend run build`
2. `pm2 restart razowild-storefront razowild-admin`
3. `pm2 restart razowild-api`

## Incident quick triage

1. Check API health endpoint.
2. Check PM2 process status/memory restarts.
3. Check recent deploy diff (`git log -n 5`).
4. Check Nginx error logs for upstream failures.
5. Confirm DB connectivity from EC2 host.

## Backup and restore recommendations

- Daily automated RDS snapshot backups (retention 7-14 days minimum)
- Manual snapshot before schema changes or large imports
- Quarterly restore drill into staging and smoke test critical paths

## Logging and monitoring baseline

- PM2 logs persisted and rotated (`pm2 install pm2-logrotate`)
- CloudWatch alarms:
  - EC2 CPU high
  - EC2 memory high (via CloudWatch Agent)
  - ALB/instance 5xx spike
  - RDS CPU and free storage thresholds
- Uptime checks for:
  - `https://www.yourdomain.com`
  - `https://admin.yourdomain.com`
  - `https://api.yourdomain.com/api/health`

## Security maintenance cadence

- Weekly: `sudo apt-get update && sudo apt-get upgrade -y`
- Monthly: dependency vulnerability review (`npm audit` in root/backend/frontend)
- Quarterly: rotate JWT/admin tokens and SMTP credentials
- Ongoing: keep `ADMIN_EMAILS` current and least-privilege
