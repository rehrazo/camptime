const express = require('express');
const Stripe = require('stripe');
const ordersRouter = require('./orders');

const router = express.Router();

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function amountToCents(value) {
  return Math.max(0, Math.round(toNumber(value, 0) * 100));
}

function sanitizeItems(items = []) {
  return items
    .map((item) => ({
      id: item?.id ?? item?.productId,
      productId: item?.productId ?? item?.id,
      name: String(item?.name || 'Product').trim() || 'Product',
      price: Math.max(0, toNumber(item?.price, 0)),
      quantity: Math.max(1, Math.floor(toNumber(item?.quantity, 1))),
    }))
    .filter((item) => item.id && item.quantity > 0);
}

router.post('/create-checkout-session', async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' });
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  });

  try {
    const payload = req.body || {};
    const items = sanitizeItems(payload.items);

    if (!items.length) {
      return res.status(400).json({ error: 'Checkout requires at least one item.' });
    }

    const order = ordersRouter.createOrderRecord({
      ...payload,
      items,
    }, {
      status: 'pending_payment',
      payment: {
        provider: 'stripe',
        status: 'pending',
      },
    });

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: amountToCents(item.price),
      },
      quantity: item.quantity,
    }));

    const shippingAmount = amountToCents(payload?.totals?.shipping);
    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: shippingAmount,
        },
        quantity: 1,
      });
    }

    const taxAmount = amountToCents(payload?.totals?.tax);
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Tax' },
          unit_amount: taxAmount,
        },
        quantity: 1,
      });
    }

    const origin =
      process.env.FRONTEND_URL ||
      req.headers.origin ||
      'http://localhost:3000';

    const successUrl = `${origin}/order-confirmation/${encodeURIComponent(order.orderId)}?paid=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout?canceled=1&order_id=${encodeURIComponent(order.orderId)}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: payload?.customer?.email || undefined,
      metadata: {
        orderId: order.orderId,
      },
    });

    ordersRouter.updateOrder(order.orderId, {
      payment: {
        provider: 'stripe',
        status: 'pending',
        sessionId: session.id,
      },
    });

    return res.json({
      orderId: order.orderId,
      sessionId: session.id,
      url: session.url,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create Stripe checkout session' });
  }
});

module.exports = router;
