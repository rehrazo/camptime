# AWS Go-Live Checklist

Use this checklist on deployment day.

## Pre-cutover

- [ ] Free-tier profile selected (`t3.micro` EC2 + `db.t3.micro` RDS) if cost-minimized setup is required
- [ ] No ALB or NAT Gateway created (unless intentionally budgeted)
- [ ] AWS Budget alerts configured and tested
- [ ] EC2 is reachable by SSH only from trusted IPs
- [ ] RDS connectivity verified from EC2 host
- [ ] `backend/.env` has production values and no placeholders
- [ ] `frontend/.env.production` points to `https://api.yourdomain.com`
- [ ] `npm --prefix frontend run build` completed successfully
- [ ] PM2 processes are running: `razowild-api`, `razowild-storefront`, `razowild-admin`
- [ ] `curl http://127.0.0.1:4000/api/health` is healthy
- [ ] Nginx config test passes: `sudo nginx -t`
- [ ] TLS certificates issued for `www`, `admin`, `api`
- [ ] DNS TTL lowered (for faster rollback if needed)

## Cutover

- [ ] Point DNS records to EC2/ALB
- [ ] Verify `https://www.yourdomain.com`
- [ ] Verify `https://admin.yourdomain.com`
- [ ] Verify `https://api.yourdomain.com/api/health`
- [ ] Test customer login, cart, checkout, order confirmation
- [ ] Test admin login and one low-risk admin update

## Immediate post-cutover

- [ ] Watch PM2 logs for 15-30 minutes
- [ ] Watch Nginx access/error logs for spikes and 5xx responses
- [ ] Confirm Stripe payment web flow success
- [ ] Confirm no CORS errors in browser console
- [ ] Confirm uploads/import endpoints work

## Rollback trigger examples

- [ ] API health consistently degraded
- [ ] Checkout flow failing for production users
- [ ] Repeated 5xx responses from API or frontend
- [ ] Data-integrity risk identified

## Rollback actions

- [ ] Re-point DNS to previous environment
- [ ] Restore previous frontend build artifact
- [ ] `pm2 restart` previous known-good process config
- [ ] Restore DB snapshot only if data correction is required
- [ ] Publish incident note with timeline and impact
