# Stripe Go-Live Notes (Camptime)

## Scope
This document covers Stripe setup and production readiness for the current Camptime integration.

Current integration includes:

- Backend endpoint to create Stripe Checkout sessions: `POST /api/payments/create-checkout-session`
- Frontend checkout redirects customer to Stripe-hosted Checkout page
- Order record created before redirect with status `pending_payment`

## Required Environment Variables

Set these in production (backend):

- `STRIPE_SECRET_KEY=sk_live_...`
- `STRIPE_PUBLISHABLE_KEY=pk_live_...`
- `FRONTEND_URL=https://www.yourdomain.com` (or storefront domain)

Optional frontend fallback:

- `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`

Notes:

- Secret key must stay server-side only.
- Publishable key can be exposed to frontend.

## Stripe Dashboard Setup

1. Create/verify Stripe account.
2. Activate account for live mode.
3. Set business details, payouts, and banking.
4. Enable required payment methods in Stripe Dashboard.
5. Configure branding (logo/colors/support URL) for Checkout page.

## Local Testing Checklist

1. Use Stripe test keys (`sk_test_...`, `pk_test_...`).
2. Start backend + frontend.
3. Place test order via checkout.
4. Confirm redirect to Stripe Checkout.
5. Pay with Stripe test card:
   - Success: `4242 4242 4242 4242`
   - Any future expiry, any CVC, any ZIP
6. Confirm redirect back to order confirmation page.

## Detailed Test Steps (Recommended)

### A) Happy-path payment

1. Add at least one product to cart.
2. Go to `/checkout` and fill shipping/contact fields.
3. Confirm checkout banner shows **Stripe Mode: Test**.
4. Click **Continue to Secure Payment**.
5. On Stripe Checkout use:
  - Card: `4242 4242 4242 4242`
  - Expiry: any future date
  - CVC: any 3 digits
  - ZIP: any value
6. Verify redirect to:
  - `/order-confirmation/:orderId?paid=1...`
7. Verify cart is cleared and order details are shown.

### B) Customer cancels payment

1. Start checkout and click **Continue to Secure Payment**.
2. On Stripe page click **Back** / **Cancel**.
3. Verify return to `/checkout?canceled=1&order_id=...`.
4. Verify no crash and customer can retry payment.

### C) Card declined flow

1. Start checkout and redirect to Stripe.
2. Use decline card:
  - `4000 0000 0000 0002`
3. Verify Stripe shows payment failure and does not complete redirect as paid.

### D) API-level smoke checks

1. Backend health: `GET /api/health` returns 200.
2. Checkout session creation: `POST /api/payments/create-checkout-session` returns `sessionId`.
3. Order endpoint: `GET /api/orders/:orderId` returns order record after flow.

## Production Cutover Checklist

1. Replace test keys with live keys.
2. Set `FRONTEND_URL` to live storefront domain.
3. Ensure HTTPS is enabled for all domains.
4. Verify CORS allows storefront/admin origins only.
5. Run a low-value live transaction and refund it.
6. Confirm payout schedule and bank settlement.

## Webhooks (Recommended for Production)

Current flow creates order as `pending_payment` before redirect. For full reliability, add Stripe webhooks to confirm payment events server-to-server.

Recommended events:

- `checkout.session.completed`
- `payment_intent.payment_failed`
- `charge.refunded` (if refund workflows are needed)

Implementation recommendation:

- Add endpoint `POST /api/payments/webhook`
- Verify Stripe signature using webhook signing secret (`STRIPE_WEBHOOK_SECRET`)
- Update order status based on event type:
  - `pending_payment` -> `paid`
  - `pending_payment` -> `payment_failed`

Without webhooks, redirects alone are less reliable (user can close browser before return URL).

## Security Notes

- Never collect/store raw card numbers in your app.
- Stripe Checkout handles card data collection and PCI scope reduction.
- Keep secret keys out of client bundles and logs.
- Rotate keys periodically.
- Restrict dashboard access with MFA.

## Operational Notes

- Log Stripe session ID + internal order ID mapping for support.
- Monitor failed payment rates and abandoned checkouts.
- Add retry UX for canceled/failed checkout returns.

## Useful Return URL Behavior

Current success URL pattern includes:

- `/order-confirmation/:orderId?paid=1&session_id={CHECKOUT_SESSION_ID}`

Current cancel URL pattern includes:

- `/checkout?canceled=1&order_id=...`

Recommended UX improvements:

- Show user-friendly canceled payment notice on checkout page when `canceled=1`.
- Persist and display retry CTA.

## Compliance / Policy

- Publish refund and shipping policy links in Checkout/terms.
- Ensure statement descriptor configured in Stripe to reduce chargebacks.

## Quick Troubleshooting

### "Stripe is not configured"
- Missing `STRIPE_SECRET_KEY` on backend.

### Checkout redirects fail
- Missing/invalid publishable key.
- Incorrect domain in `FRONTEND_URL`.

### Orders stuck in pending_payment
- Webhook handling not implemented or webhook delivery failing.

## Suggested Next Step

Implement webhook endpoint + order status updates before full production launch.
