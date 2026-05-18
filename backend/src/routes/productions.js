const express = require('express');
const pool = require('../config/db');
const { auth, requireRoles } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const { adjustStock, checkLowStock } = require('../utils/stock');
const { sendTelegram } = require('../utils/telegram');

const router = express.Router();

router.get('/', auth(), requireRoles('admin', 'worker'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT pr.*, p.name AS product_name, p.size, u.name AS user_name
       FROM productions pr
       JOIN products p ON p.id = pr.product_id
       JOIN users u ON u.id = pr.user_id
       ORDER BY pr.created_at DESC
       LIMIT 500`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', auth(), requireRoles('admin', 'worker'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { product_id, quantity, comment, created_at } = req.body;
    const qty = Number(quantity);
    if (!product_id || !qty || qty <= 0) {
      return res.status(400).json({ error: 'Укажите тип блока и количество' });
    }

    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO productions (product_id, quantity, user_id, comment, created_at)
       VALUES (?, ?, ?, ?, COALESCE(?, NOW()))`,
      [product_id, qty, req.user.id, comment || null, created_at || null]
    );

    await adjustStock(product_id, qty, conn);
    await logAction(
      req.user.id,
      'production',
      'production',
      result.insertId,
      { product_id, quantity: qty },
      conn
    );

    await conn.commit();

    const [info] = await pool.execute(
      `SELECT p.name, p.size FROM products p WHERE p.id = ?`,
      [product_id]
    );
    const p = info[0];
    await sendTelegram(
      `🏭 <b>Добавлено производство</b>\n\n` +
        `Товар: ${p?.name || product_id}${p?.size ? ` (${p.size})` : ''}\n` +
        `Количество: ${qty} шт\n` +
        `Ответственный: ${req.user.name}\n` +
        `Дата: ${new Date().toLocaleString('ru-RU')}`
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    conn.release();
  }
});

module.exports = router;
