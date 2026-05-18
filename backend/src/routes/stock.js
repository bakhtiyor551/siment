const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

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
