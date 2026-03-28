const express = require('express');

const router = express.Router();

function sanitizeText(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function mapPayload(body = {}) {
  return {
    name: String(body.name || '').trim(),
    email: sanitizeText(body.email),
    phone: sanitizeText(body.phone),
    address_line1: sanitizeText(body.address_line1),
    address_line2: sanitizeText(body.address_line2),
    city: sanitizeText(body.city),
    state: sanitizeText(body.state),
    postal_code: sanitizeText(body.postal_code),
    country: sanitizeText(body.country),
    notes: sanitizeText(body.notes),
  };
}

router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    const [rows] = await pool.execute(
      `SELECT drop_shipper_id, name, email, phone, address_line1, address_line2,
              city, state, postal_code, country, notes
       FROM drop_shippers
       ORDER BY name ASC, drop_shipper_id ASC`
    );

    const data = rows.map((row) => ({
      id: row.drop_shipper_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address_line1: row.address_line1,
      address_line2: row.address_line2,
      city: row.city,
      state: row.state,
      postal_code: row.postal_code,
      country: row.country,
      notes: row.notes,
    }));

    return res.json({ data });
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to load drop shippers' });
  }
});

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const payload = mapPayload(req.body);

  if (!payload.name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO drop_shippers (
        name, email, phone, address_line1, address_line2, city, state, postal_code, country, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.name,
        payload.email,
        payload.phone,
        payload.address_line1,
        payload.address_line2,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.country,
        payload.notes,
      ]
    );

    return res.status(201).json({ id: result.insertId, ...payload });
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to create drop shipper' });
  }
});

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = Number(req.params.id);
  const payload = mapPayload(req.body);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid drop shipper id' });
  }

  if (!payload.name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE drop_shippers
       SET name = ?, email = ?, phone = ?,
           address_line1 = ?, address_line2 = ?, city = ?, state = ?, postal_code = ?, country = ?, notes = ?
       WHERE drop_shipper_id = ?`,
      [
        payload.name,
        payload.email,
        payload.phone,
        payload.address_line1,
        payload.address_line2,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.country,
        payload.notes,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Drop shipper not found' });
    }

    return res.json({ id, ...payload });
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to update drop shipper' });
  }
});

router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid drop shipper id' });
  }

  try {
    const [result] = await pool.execute('DELETE FROM drop_shippers WHERE drop_shipper_id = ?', [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Drop shipper not found' });
    }

    return res.status(204).send();
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to delete drop shipper' });
  }
});

module.exports = router;
