const express = require('express');
const path = require('path');
const XLSX = require('xlsx');
const { requireAdminAuthIfConfigured } = require('../middleware/adminAuth');

const router = express.Router();

const orders = new Map();
const DOBA_TEMPLATE_PATH = path.join(__dirname, '..', 'orders_upload_doba.xls');
const DOBA_MAX_ITEMS = 10;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeItems(items = []) {
  return items
    .filter((item) => item && (item.productId || item.id) && toNumber(item.quantity, 0) > 0)
    .map((item) => ({
      id: item.id ?? item.productId,
      productId: item.productId ?? item.id,
      name: item.name || 'Product',
      price: toNumber(item.price, 0),
      quantity: Math.max(1, Math.floor(toNumber(item.quantity, 1))),
      sku: item.sku || item.sku_code || item.productId || item.id || ''
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

function createInitialLifecycle(createdAt) {
  return {
    created: { status: 'created', date: createdAt },
    exported: { status: 'not_exported', date: null },
    processed: { status: 'not_processed', date: null },
    shipped: { status: 'not_shipped', date: null }
  };
}

function ensureLifecycle(order = {}) {
  const createdDate = order.createdAt || nowIso();
  const lifecycle = order.lifecycle || createInitialLifecycle(createdDate);

  if (!lifecycle.created) {
    lifecycle.created = { status: 'created', date: createdDate };
  }
  if (!lifecycle.exported) {
    lifecycle.exported = { status: 'not_exported', date: null };
  }
  if (!lifecycle.processed) {
    lifecycle.processed = { status: 'not_processed', date: null };
  }
  if (!lifecycle.shipped) {
    lifecycle.shipped = { status: 'not_shipped', date: null };
  }

  return lifecycle;
}

function createOrderRecord(payload = {}, options = {}) {
  const items = normalizeItems(payload.items);

  if (!items.length) {
    const error = new Error('Order must include at least one item');
    error.status = 400;
    throw error;
  }

  const customer = {
    firstName: payload.customer?.firstName || '',
    lastName: payload.customer?.lastName || '',
    email: payload.customer?.email || '',
    phone: payload.customer?.phone || ''
  };

  const shipping = {
    address: payload.shipping?.address || '',
    address2: payload.shipping?.address2 || '',
    city: payload.shipping?.city || '',
    state: payload.shipping?.state || '',
    country: payload.shipping?.country || 'US',
    zip: payload.shipping?.zip || '',
    method: payload.shipping?.method || 'standard'
  };

  const totals = calculateTotals(items, payload.totals?.shipping, payload.totals?.tax);
  const createdAt = nowIso();
  const orderId = options.orderId || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const order = {
    orderId,
    createdAt,
    status: options.status || 'created',
    customer,
    shipping,
    items,
    totals,
    payment: options.payment || null,
    lifecycle: createInitialLifecycle(createdAt)
  };

  orders.set(orderId, order);
  return order;
}

function getOrderById(orderId) {
  const order = orders.get(orderId) || null;
  if (!order) {
    return null;
  }

  order.lifecycle = ensureLifecycle(order);
  return order;
}

function updateOrder(orderId, patch = {}) {
  const existing = orders.get(orderId);
  if (!existing) {
    return null;
  }

  const next = {
    ...existing,
    ...patch
  };

  next.lifecycle = ensureLifecycle(next);
  orders.set(orderId, next);
  return next;
}

function buildDobaRow(order = {}) {
  const fullName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim();
  const items = Array.isArray(order.items) ? order.items.slice(0, DOBA_MAX_ITEMS) : [];

  const row = [
    order.orderId,
    'RazoWild',
    Number(order.totals?.total || 0).toFixed(2),
    fullName,
    order.customer?.phone || '',
    order.shipping?.address || '',
    order.shipping?.address2 || '',
    order.shipping?.city || '',
    order.shipping?.state || '',
    order.shipping?.country || 'US',
    order.shipping?.zip || ''
  ];

  for (let index = 0; index < DOBA_MAX_ITEMS; index += 1) {
    const item = items[index];
    row.push(item?.sku || item?.productId || item?.id || '');
    row.push(item?.quantity || '');
  }

  return row;
}

router.get('/', (req, res) => {
  const data = [...orders.values()]
    .map((order) => ({ ...order, lifecycle: ensureLifecycle(order) }))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  return res.json({ data });
});

router.get('/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const order = getOrderById(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  return res.json(order);
});

router.post('/', (req, res) => {
  try {
    const payload = req.body || {};
    const order = createOrderRecord(payload);

    return res.status(201).json({
      orderId: order.orderId,
      message: 'Order placed successfully'
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Failed to create order' });
  }
});

router.post('/export/doba', requireAdminAuthIfConfigured, (req, res) => {
  try {
    const orderIds = Array.isArray(req.body?.orderIds)
      ? req.body.orderIds.map((value) => String(value || '').trim()).filter(Boolean)
      : [];

    if (!orderIds.length) {
      return res.status(400).json({ error: 'orderIds is required' });
    }

    const selectedOrders = orderIds
      .map((orderId) => getOrderById(orderId))
      .filter(Boolean);

    if (!selectedOrders.length) {
      return res.status(404).json({ error: 'No matching orders found' });
    }

    const workbook = XLSX.readFile(DOBA_TEMPLATE_PATH, { cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false })[0] || [];
    const rows = selectedOrders.map((order) => {
      const row = buildDobaRow(order);
      if (row.length < headerRow.length) {
        return row.concat(new Array(headerRow.length - row.length).fill(''));
      }
      return row;
    });

    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: 'A2' });

    const exportedAt = nowIso();
    selectedOrders.forEach((order) => {
      order.lifecycle = ensureLifecycle(order);
      order.lifecycle.exported = {
        status: 'exported',
        date: exportedAt
      };
      orders.set(order.orderId, order);
    });

    const buffer = XLSX.write(workbook, { bookType: 'xls', type: 'buffer' });
    const fileName = `doba_orders_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.xls`;

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to export Doba file' });
  }
});

router.post('/lifecycle/update', requireAdminAuthIfConfigured, (req, res) => {
  const orderIds = Array.isArray(req.body?.orderIds)
    ? req.body.orderIds.map((value) => String(value || '').trim()).filter(Boolean)
    : [];
  const stage = String(req.body?.stage || '').trim().toLowerCase();

  const allowedStages = new Set(['processed', 'shipped']);
  if (!allowedStages.has(stage)) {
    return res.status(400).json({ error: 'stage must be one of: processed, shipped' });
  }

  if (!orderIds.length) {
    return res.status(400).json({ error: 'orderIds is required' });
  }

  const stageStatus = stage;
  const stageDate = nowIso();
  let updated = 0;

  orderIds.forEach((orderId) => {
    const order = getOrderById(orderId);
    if (!order) {
      return;
    }

    order.lifecycle[stage] = {
      status: stageStatus,
      date: stageDate
    };

    orders.set(orderId, order);
    updated += 1;
  });

  return res.json({
    message: `${updated} order(s) updated`,
    updated
  });
});

module.exports = router;
module.exports.createOrderRecord = createOrderRecord;
module.exports.getOrderById = getOrderById;
module.exports.updateOrder = updateOrder;
