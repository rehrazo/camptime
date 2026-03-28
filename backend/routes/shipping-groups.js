const express = require('express');

const router = express.Router();

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePayload(body = {}) {
  return {
    name: String(body.name || '').trim(),
    cost: toNumber(body.cost, NaN),
  };
}

router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    const [rows] = await pool.execute(
      `SELECT shipping_group_id, name, cost
       FROM shipping_groups
       ORDER BY shipping_group_id ASC`
    );

    const data = rows.map((row) => ({
      id: row.shipping_group_id,
      name: row.name,
      cost: Number(row.cost || 0),
    }));

    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load shipping groups' });
  }
});

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const payload = normalizePayload(req.body);

  if (!payload.name) {
    return res.status(400).json({ error: 'name is required' });
  }

  if (!Number.isFinite(payload.cost) || payload.cost < 0) {
    return res.status(400).json({ error: 'cost must be a non-negative number' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO shipping_groups (name, cost)
       VALUES (?, ?)`,
      [payload.name, payload.cost]
    );

    return res.status(201).json({
      id: result.insertId,
      name: payload.name,
      cost: payload.cost,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create shipping group' });
  }
});

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = Number(req.params.id);
  const payload = normalizePayload(req.body);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid shipping group id' });
  }

  if (!payload.name) {
    return res.status(400).json({ error: 'name is required' });
  }

  if (!Number.isFinite(payload.cost) || payload.cost < 0) {
    return res.status(400).json({ error: 'cost must be a non-negative number' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE shipping_groups
       SET name = ?, cost = ?
       WHERE shipping_group_id = ?`,
      [payload.name, payload.cost, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Shipping group not found' });
    }

    return res.json({
      id,
      name: payload.name,
      cost: payload.cost,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update shipping group' });
  }
});

router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid shipping group id' });
  }

  try {
    const [result] = await pool.execute(
      `DELETE FROM shipping_groups
       WHERE shipping_group_id = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Shipping group not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete shipping group' });
  }
});

module.exports = router;
