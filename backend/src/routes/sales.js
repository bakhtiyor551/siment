const express = require('express');
const pool = require('../config/db');
const { auth, requireRoles } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const { getStockQuantity, adjustStock, checkLowStock } = require('../utils/stock');
const { sendTelegram } = require('../utils/telegram');

const router = express.Router();

function formatDate(d) {
  return new Date(d).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAYMENT_LABELS = {
  cash: 'Наличные',
  transfer: 'Перевод',
  debt: 'Долг',
  mixed: 'Смешанная оплата',
};

router.get('/', auth(), async (req, res) => {
  try {
    let sql = `
      SELECT s.*, c.name AS client_name, c.phone AS client_phone, u.name AS seller_name
      FROM sales s
      LEFT JOIN clients c ON c.id = s.client_id
      JOIN users u ON u.id = s.user_id
      WHERE 1=1`;
    const params = [];

    if (req.user.role === 'seller') {
      sql += ' AND s.user_id = ?';
      params.push(req.user.id);
    }

    if (req.query.from) {
      sql += ' AND DATE(s.created_at) >= ?';
      params.push(req.query.from);
    }
    if (req.query.to) {
      sql += ' AND DATE(s.created_at) <= ?';
      params.push(req.query.to);
    }

    sql += ' ORDER BY s.created_at DESC LIMIT 300';
    const [rows] = await pool.execute(sql, params);

    for (const sale of rows) {
      const [items] = await pool.execute(
        `SELECT si.*, p.name AS product_name, p.size
         FROM sale_items si
         JOIN products p ON p.id = si.product_id
         WHERE si.sale_id = ?`,
        [sale.id]
      );
      sale.items = items;
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', auth(), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, c.name AS client_name, c.phone AS client_phone, u.name AS seller_name
       FROM sales s
       LEFT JOIN clients c ON c.id = s.client_id
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    if (req.user.role === 'seller' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    const [items] = await pool.execute(
      `SELECT si.*, p.name AS product_name, p.size
       FROM sale_items si JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );
    res.json({ ...rows[0], items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', auth(), requireRoles('admin', 'seller'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      client_id,
      client_name,
      client_phone,
      items,
      payment_type,
      paid_amount,
      discount = 0,
      comment,
    } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: 'Добавьте хотя бы один товар' });
    }
    if (!payment_type) {
      return res.status(400).json({ error: 'Укажите способ оплаты' });
    }

    await conn.beginTransaction();

    let clientId = client_id || null;
    if (!clientId && client_name) {
      const [existing] = await conn.execute(
        'SELECT id FROM clients WHERE phone = ? LIMIT 1',
        [client_phone || '']
      );
      if (existing.length) {
        clientId = existing[0].id;
      } else {
        const [cr] = await conn.execute(
          'INSERT INTO clients (name, phone) VALUES (?, ?)',
          [client_name, client_phone || null]
        );
        clientId = cr.insertId;
      }
    }

    let totalAmount = 0;
    const lineItems = [];

    for (const item of items) {
      const qty = Number(item.quantity);
      const price = Number(item.price);
      if (!item.product_id || !qty || qty <= 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Некорректная позиция' });
      }

      const stockQty = await getStockQuantity(item.product_id, conn);
      if (stockQty < qty) {
        await conn.rollback();
        const [p] = await conn.execute('SELECT name FROM products WHERE id = ?', [
          item.product_id,
        ]);
        return res.status(400).json({
          error: `Недостаточно на складе: ${p[0]?.name || item.product_id}. Доступно: ${stockQty}`,
        });
      }

      const lineTotal = qty * price;
      totalAmount += lineTotal;
      lineItems.push({ ...item, qty, price, lineTotal });
    }

    const discountVal = Number(discount) || 0;
    totalAmount = Math.max(0, totalAmount - discountVal);

    let paid = Number(paid_amount);
    if (payment_type === 'cash' || payment_type === 'transfer') {
      paid = totalAmount;
    } else if (payment_type === 'debt') {
      paid = 0;
    } else if (Number.isNaN(paid)) {
      paid = 0;
    }

    const debt = Math.max(0, totalAmount - paid);

    const [saleResult] = await conn.execute(
      `INSERT INTO sales (client_id, user_id, total_amount, paid_amount, debt_amount, payment_type, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, req.user.id, totalAmount, paid, debt, payment_type, comment || null]
    );
    const saleId = saleResult.insertId;

    for (const item of lineItems) {
      await conn.execute(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, total)
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, item.product_id, item.qty, item.price, item.lineTotal]
      );
      await adjustStock(item.product_id, -item.qty, conn);
    }

    await conn.execute(
      `INSERT INTO payments (sale_id, client_id, amount, payment_type) VALUES (?, ?, ?, ?)`,
      [saleId, clientId, paid, payment_type]
    );

    if (clientId) {
      await conn.execute(
        `UPDATE clients SET
           total_purchases = total_purchases + ?,
           total_debt = total_debt + ?
         WHERE id = ?`,
        [totalAmount, debt, clientId]
      );
    }

    await logAction(req.user.id, 'sale', 'sale', saleId, { totalAmount, debt }, conn);
    await conn.commit();

    for (const item of lineItems) {
      await checkLowStock(item.product_id);
    }

    const [clientRows] = clientId
      ? await pool.execute('SELECT name, phone FROM clients WHERE id = ?', [clientId])
      : [[{ name: client_name, phone: client_phone }]];

    const client = clientRows[0] || {};
    const [productInfo] = await pool.execute(
      `SELECT p.name, p.size, si.quantity, si.price, si.total
       FROM sale_items si JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`,
      [saleId]
    );

    const itemsText = productInfo
      .map(
        (p) =>
          `Товар: ${p.name}${p.size ? ` (${p.size})` : ''}\n` +
          `Количество: ${p.quantity} шт\n` +
          `Цена: ${p.price} сомони\n` +
          `Сумма: ${p.total} сомони`
      )
      .join('\n\n');

    let msg =
      `🧱 <b>Новая продажа цементных блоков</b>\n\n` +
      `Клиент: ${client.name || '—'}\n` +
      `Телефон: ${client.phone || '—'}\n` +
      `${itemsText}\n` +
      `Оплата: ${PAYMENT_LABELS[payment_type] || payment_type}\n` +
      `Продавец: ${req.user.name}\n` +
      `Дата: ${formatDate(new Date())}`;

    if (debt > 0) {
      msg += `\n\n💳 <b>Продажа в долг</b>\nОплачено: ${paid} сомони\nДолг: ${debt} сомони`;
    }

    await sendTelegram(msg);

    res.status(201).json({ id: saleId, total_amount: totalAmount, debt_amount: debt });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    conn.release();
  }
});

module.exports = router;
