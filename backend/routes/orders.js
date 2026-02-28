const express = require('express');

const router = express.Router();

const orders = new Map();

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeItems(items = []) {
  return items
    .filter((item) => item && (item.productId || item.id) && toNumber(item.quantity, 0) > 0)
    .map((item) => ({
      id: item.id ?? item.productId,
      productId: item.productId ?? item.id,
      name: item.name || 'Product',
      price: toNumber(item.price, 0),
      quantity: Math.max(1, Math.floor(toNumber(item.quantity, 1)))
    }));
}

function calculateTotals(items, shipping, tax) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const normalizedShipping = Math.max(0, toNumber(shipping, 0));
  const normalizedTax = Math.max(0, toNumber(tax, 0));

  return {
    subtotal,
    shipping: normalizedShipping,
    tax: normalizedTax,
    total: subtotal + normalizedShipping + normalizedTax
  };
}

router.get('/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  return res.json(order);
});

router.post('/', (req, res) => {
  const payload = req.body || {};
  const items = normalizeItems(payload.items);

  if (!items.length) {
    return res.status(400).json({ error: 'Order must include at least one item' });
  }

  const customer = {
    firstName: payload.customer?.firstName || '',
    lastName: payload.customer?.lastName || '',
    email: payload.customer?.email || '',
    phone: payload.customer?.phone || ''
  };

  const shipping = {
    address: payload.shipping?.address || '',
    city: payload.shipping?.city || '',
    state: payload.shipping?.state || '',
    zip: payload.shipping?.zip || '',
    method: payload.shipping?.method || 'standard'
  };

  const totals = calculateTotals(items, payload.totals?.shipping, payload.totals?.tax);

  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const order = {
    orderId,
    createdAt: new Date().toISOString(),
    customer,
    shipping,
    items,
    totals
  };

  orders.set(orderId, order);

  return res.status(201).json({
    orderId,
    message: 'Order placed successfully'
  });
});

module.exports = router;
