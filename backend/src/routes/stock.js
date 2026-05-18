const express = require('express');
const pool = require('../config/db');
const { auth, requireRoles } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const { adjustStock, checkLowStock } = require('../utils/stock');

const router = express.Router();

router.post('/add', auth(), requireRoles('admin', 'seller', 'worker'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { product_id, quantity, comment } = req.body;
    const qty = Number(quantity);
    if (!product_id || !qty || qty <= 0) {
      return res.status(400).json({ error: 'Укажите товар и количество' });
    }

    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO productions (product_id, quantity, user_id, comment)
       VALUES (?, ?, ?, ?)`,
      [product_id, qty, req.user.id, comment || 'Пополнение склада']
    );

    await adjustStock(product_id, qty, conn);
    await logAction(req.user.id, 'stock_add', 'stock', result.insertId, { product_id, quantity: qty }, conn);

    await conn.commit();
    await checkLowStock(product_id);

    res.status(201).json({ ok: true, production_id: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    conn.release();
  }
});

router.get('/', auth(), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         p.id,
         p.name,
         p.size,
         p.unit,
         p.sale_price,
         p.min_stock,
         COALESCE(SUM(pr.quantity), 0) AS produced,
         COALESCE(SUM(si.quantity), 0) AS sold,
         COALESCE(s.quantity, 0) AS balance
       FROM products p
       LEFT JOIN stock s ON s.product_id = p.id
       LEFT JOIN productions pr ON pr.product_id = p.id
       LEFT JOIN sale_items si ON si.product_id = p.id
       WHERE p.status = 'active'
       GROUP BY p.id, p.name, p.size, p.unit, p.sale_price, p.min_stock, s.quantity
       ORDER BY p.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:productId', auth(), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, COALESCE(s.quantity, 0) AS balance
       FROM products p
       LEFT JOIN stock s ON s.product_id = p.id
       WHERE p.id = ?`,
      [req.params.productId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
