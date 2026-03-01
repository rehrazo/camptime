# Camptime Go-Live Runbook

## Goal
Deploy storefront and admin separately under subdomains with secure routing and isolated operations.

- Storefront: `https://www.yourdomain.com`
- Admin: `https://admin.yourdomain.com`
- API: `https://api.yourdomain.com` (or private/internal)

## Recommended Production Topology
Run each app on its own internal service/port behind a reverse proxy:

- Storefront frontend service: `127.0.0.1:3000`
- Admin frontend service: `127.0.0.1:3001`
- Backend API service: `127.0.0.1:4000`
- Reverse proxy (Nginx/Traefik): TLS termination + host-based routing

Why this split:

- Security isolation for admin traffic
- Independent deploys/rollbacks
- Independent scaling/resource limits
- Cleaner CORS/cookie policy boundaries

## DNS
Create these DNS records:

- `www.yourdomain.com` -> your server/load balancer
- `admin.yourdomain.com` -> your server/load balancer
- `api.yourdomain.com` -> your server/load balancer

## Nginx Example
Use host-based routing to each internal port.

```nginx
server {
  listen 443 ssl;
  server_name www.yourdomain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}

server {
  listen 443 ssl;
  server_name admin.yourdomain.com;

  # Optional: lock admin to known office/VPN IPs
  # allow 203.0.113.10;
  # deny all;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}

server {
  listen 443 ssl;
  server_name api.yourdomain.com;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

## Environment Variables
### Storefront frontend

- `VITE_API_BASE_URL=https://api.yourdomain.com`

### Admin frontend

- `VITE_API_BASE_URL=https://api.yourdomain.com`

### Backend API

- `PORT=4000`
- `TRUST_PROXY=true`
- `CORS_ALLOWED_ORIGINS=https://www.yourdomain.com,https://admin.yourdomain.com`

## Backend Security Controls
Enforce these in the API layer (not just frontend):

- Role-based access control for all admin endpoints
- Admin session/auth policy separate from storefront policy
- Strong password policy and MFA for admin users
- Tighter rate limits on admin login/auth routes
- Audit logging for critical admin actions (price changes, category moves, product deletes)

## Cookies and Session Policy
Use secure cookies in production:

- `Secure=true`
- `HttpOnly=true`
- `SameSite=Lax` (or stricter where possible)
- Shorter TTL for admin sessions

If using cross-subdomain auth, validate cookie domain scope carefully and keep admin/storefront permissions isolated.

## CORS Policy
Allow only explicit origins:

- `https://www.yourdomain.com`
- `https://admin.yourdomain.com`

Do not use wildcard origins for authenticated APIs.

## Go-Live Checklist

1. TLS certificates active for all subdomains.
2. DNS records resolve correctly.
3. Reverse proxy routes to correct internal ports.
4. Frontend builds use production `VITE_API_BASE_URL`.
5. Backend CORS set to exact origins.
6. Admin routes protected with RBAC.
7. Rate limiting enabled for auth and admin APIs.
8. Logging/monitoring/alerts enabled.
9. Database backups + restore test complete.
10. Rollback plan validated (previous frontend build + backend release).

## Optional Hardening

- Restrict `admin.yourdomain.com` by IP allowlist or VPN
- WAF rules for admin and auth endpoints
- Separate admin service account/secrets from storefront
- Separate error alert channels for admin and storefront

## Notes for This Repo
Current recommendation is to keep one backend API service and split storefront/admin frontend deployment targets. This gives most of the operational/security benefits while minimizing migration effort.
