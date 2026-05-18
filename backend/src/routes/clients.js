const express = require('express');
const pool = require('../config/db');
const { auth, requireRoles } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/', auth(), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM clients ORDER BY name LIMIT 500'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/debts', auth(), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         s.id AS sale_id,
         s.created_at,
         s.total_amount,
         s.paid_amount,
         s.debt_amount,
         s.payment_type,
         c.id AS client_id,
         c.name AS client_name,
         c.phone AS client_phone,
         CASE WHEN s.debt_amount > 0 THEN 'open' ELSE 'closed' END AS status
       FROM sales s
       JOIN clients c ON c.id = s.client_id
       WHERE s.debt_amount > 0
       ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', auth(), requireRoles('admin', 'seller'), async (req, res) => {
  try {
    const { name, phone, address, comment } = req.body;
    if (!name) return res.status(400).json({ error: 'Укажите имя клиента' });

    const [result] = await pool.execute(
      'INSERT INTO clients (name, phone, address, comment) VALUES (?, ?, ?, ?)',
      [name, phone || null, address || null, comment || null]
    );
    await logAction(req.user.id, 'create', 'client', result.insertId, req.body);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/:id', auth(), requireRoles('admin', 'seller'), async (req, res) => {
  try {
    const { name, phone, address, comment } = req.body;
    await pool.execute(
      'UPDATE clients SET name=?, phone=?, address=?, comment=? WHERE id=?',
      [name, phone || null, address || null, comment || null, req.params.id]
    );
    await logAction(req.user.id, 'update', 'client', Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
