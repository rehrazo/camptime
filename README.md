# Razo Wild

Razo Wild is an e-commerce storefront and admin platform for outdoor and adventure products.

## Technology Stack
- **Frontend:** Vue 3, Vue Router, Pinia, Vite
- **Backend:** Node.js, Express.js
- **Database:** MySQL (`mysql2`)
- **Payments:** Stripe Checkout
- **Auth:** JWT-based login with admin access controls

## Repository Layout
- `frontend/` Vue app (storefront + admin UI)
- `backend/` Express API and admin/import routes
- `database/schema.sql` MySQL schema
- `docs/` setup, architecture, and deployment documentation
- `deploy/` production configs (Nginx, PM2, EC2 bootstrap)

## Quick Start
1. Install dependencies:
   - `npm run install:all`
2. Configure environment variables:
   - Copy `.env.example` to `.env` and set DB/auth/payment values
   - Optionally set frontend env in `frontend/.env.local`
3. Start development:
   - `npm run dev` (backend + storefront)
   - `npm run dev:admin` (backend + admin frontend)

For full local setup details, see `docs/SETUP.md`.

## Production / Go-Live Docs
- `README-GOLIVE.md`
- `docs/deploy/AWS-EC2-DEPLOYMENT.md`
- `docs/deploy/GO-LIVE-CHECKLIST-AWS.md`
- `docs/deploy/OPERATIONS-RUNBOOK.md`

## Design Assets
- Non-product site imagery belongs in `frontend/src/assets/images/site/`
- Product catalog images should remain separate from site/brand assets