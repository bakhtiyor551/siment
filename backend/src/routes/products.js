const express = require('express');
const pool = require('../config/db');
const { auth, requireRoles } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/', auth(), async (req, res) => {
  try {
    const activeOnly = req.query.active === '1';
    let sql = 'SELECT * FROM products';
    if (activeOnly) sql += ' WHERE status = "active"';
    sql += ' ORDER BY name';
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', auth(), requireRoles('admin'), async (req, res) => {
  try {
    const { name, size, sale_price, cost_price, unit, min_stock, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Укажите название' });

    const [result] = await pool.execute(
      `INSERT INTO products (name, size, sale_price, cost_price, unit, min_stock, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        size || null,
        Number(sale_price) || 0,
        Number(cost_price) || 0,
        unit || 'шт',
        Number(min_stock) || 200,
        status || 'active',
      ]
    );

    await pool.execute(
      'INSERT INTO stock (product_id, quantity) VALUES (?, 0)',
      [result.insertId]
    );

    await logAction(req.user.id, 'create', 'product', result.insertId, req.body);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/:id', auth(), requireRoles('admin'), async (req, res) => {
  try {
    const { name, size, sale_price, cost_price, unit, min_stock, status } = req.body;
    await pool.execute(
      `UPDATE products SET name=?, size=?, sale_price=?, cost_price=?, unit=?, min_stock=?, status=?
       WHERE id=?`,
      [
        name,
        size || null,
        Number(sale_price) || 0,
        Number(cost_price) || 0,
        unit || 'шт',
        Number(min_stock) || 200,
        status || 'active',
        req.params.id,
      ]
    );
    await logAction(req.user.id, 'update', 'product', Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/:id', auth(), requireRoles('admin'), async (req, res) => {
  try {
    await pool.execute('UPDATE products SET status = "inactive" WHERE id = ?', [
      req.params.id,
    ]);
    await logAction(req.user.id, 'deactivate', 'product', Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
