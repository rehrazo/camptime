# Architecture Documentation for Razo Wild

## Technology Stack
- **Frontend:** Vue 3, Vue Router, Pinia, Axios, Vite
- **Backend:** Node.js, Express.js
- **Database:** MySQL (via `mysql2`)
- **Auth:** JWT-based login with admin email allowlist support
- **Payments:** Stripe
- **Deployment target:** AWS EC2 (Nginx + PM2) or equivalent Linux host

## Project Structure
```
razowild/
├── backend/
│   ├── routes/            # API route handlers (auth, products, categories, orders, payments)
│   ├── middleware/        # Auth/authorization middleware
│   ├── utils/             # Category and description processing utilities
│   ├── scripts/           # Data maintenance/backfill scripts
│   └── server.js          # Backend entry point
├── frontend/
│   ├── src/
│   │   ├── views/         # Page-level Vue components
│   │   ├── layouts/       # Storefront/Admin layouts
│   │   ├── router/        # Vue Router configuration
│   │   ├── stores/        # Pinia stores (auth/cart)
│   │   └── main.js        # Frontend bootstrap
│   └── package.json
├── database/
│   └── schema.sql         # MySQL schema
└── docs/
```

## Data Model (High Level)
- **users:** account identity, credentials, and role resolution inputs
- **products:** catalog core fields (pricing, inventory, descriptions, category mapping)
- **product_images / product_variations / product_packaging / product_parameters:** normalized product detail tables
- **categories:** hierarchical taxonomy with path/level metadata

## State Management
- **Pinia** stores are used for frontend app state.
- Current stores include auth/session and cart state under `frontend/src/stores/`.

## API Integration
- REST APIs are served from Express routes under `backend/routes/`.
- Core endpoints include:
  - `GET /api/products`
  - `GET /api/products/:id`
  - `POST /api/auth/login`
  - `POST /api/auth/admin/login`
  - `POST /api/orders`
  - `POST /api/payments/create-checkout-session`

## Routing Configuration
- Frontend routing is handled by **Vue Router**.
- Route structure includes:
  - Storefront pages (`/`, `/products`, `/cart`, `/checkout`, etc.)
  - Admin pages under `/admin` with admin-guarded routes
  - Auth routes such as `/login` and `/admin/login`

## Deployment Notes
- Recommended production topology uses three hostnames/subdomains:
  - `www` for storefront
  - `admin` for admin frontend
  - `api` for backend API
- Nginx handles TLS termination and reverse proxying to internal services on ports `3000`, `3001`, and `4000`.

### Conclusion
This document reflects the current Razo Wild architecture. Keep it updated as routes, services, and infrastructure evolve.