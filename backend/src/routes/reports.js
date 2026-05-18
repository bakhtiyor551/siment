const express = require('express');
const pool = require('../config/db');
const { auth, requireRoles } = require('../middleware/auth');

const router = express.Router();

function periodRange(period) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (period === 'today') return { from: today, to: today };
  if (period === 'yesterday') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    return { from: y, to: y };
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  if (period === 'month') {
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return { from, to: today };
  }
  return null;
}

router.get('/dashboard', auth(), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[prod]] = await pool.execute(
      'SELECT COALESCE(SUM(quantity), 0) AS qty FROM productions WHERE DATE(created_at) = ?',
      [today]
    );
    const [[sold]] = await pool.execute(
      `SELECT COALESCE(SUM(si.quantity), 0) AS qty
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE DATE(s.created_at) = ?`,
      [today]
    );
    const [[stock]] = await pool.execute(
      'SELECT COALESCE(SUM(quantity), 0) AS qty FROM stock'
    );
    const [[salesSum]] = await pool.execute(
      'SELECT COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS orders FROM sales WHERE DATE(created_at) = ?',
      [today]
    );

    res.json({
      produced_today: Number(prod.qty),
      sold_today: Number(sold.qty),
      stock_total: Number(stock.qty),
      sales_amount_today: Number(salesSum.total),
      orders_today: Number(salesSum.orders),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/sales', auth(), async (req, res) => {
  try {
    let { from, to } = req.query;
    if (req.query.period) {
      const range = periodRange(req.query.period);
      if (range) {
        from = range.from;
        to = range.to;
      }
    }
    if (!from || !to) {
      const range = periodRange('today');
      from = range.from;
      to = range.to;
    }

    const params = [from, to];
    let userFilter = '';
    if (req.user.role === 'seller') {
      userFilter = ' AND s.user_id = ?';
      params.push(req.user.id);
    }

    const [summary] = await pool.execute(
      `SELECT
         COUNT(DISTINCT s.id) AS sales_count,
         COALESCE(SUM(si.quantity), 0) AS blocks_sold,
         COALESCE(SUM(s.total_amount), 0) AS total_amount,
         COALESCE(SUM(CASE WHEN s.payment_type = 'cash' THEN s.paid_amount ELSE 0 END), 0) AS cash,
         COALESCE(SUM(CASE WHEN s.payment_type = 'transfer' THEN s.paid_amount ELSE 0 END), 0) AS transfer,
         COALESCE(SUM(s.debt_amount), 0) AS debt
       FROM sales s
       LEFT JOIN sale_items si ON si.sale_id = s.id
       WHERE DATE(s.created_at) BETWEEN ? AND ?${userFilter}`,
      params
    );

    res.json({ from, to, ...summary[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/production', auth(), requireRoles('admin', 'worker'), async (req, res) => {
  try {
    let { from, to } = req.query;
    if (req.query.period) {
      const range = periodRange(req.query.period);
      if (range) {
        from = range.from;
        to = range.to;
      }
    }
    if (!from || !to) {
      const range = periodRange('month');
      from = range.from;
      to = range.to;
    }

    const [rows] = await pool.execute(
      `SELECT pr.*, p.name AS product_name, p.size, u.name AS user_name
       FROM productions pr
       JOIN products p ON p.id = pr.product_id
       JOIN users u ON u.id = pr.user_id
       WHERE DATE(pr.created_at) BETWEEN ? AND ?
       ORDER BY pr.created_at DESC`,
      [from, to]
    );

    const [[totals]] = await pool.execute(
      `SELECT COALESCE(SUM(quantity), 0) AS total_produced
       FROM productions WHERE DATE(created_at) BETWEEN ? AND ?`,
      [from, to]
    );

    res.json({ from, to, total_produced: Number(totals.total_produced), items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/stock', auth(), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         p.id,
         p.name,
         p.size,
         p.min_stock,
         COALESCE(s.quantity, 0) AS balance,
         COALESCE(SUM(pr.quantity), 0) AS received,
         COALESCE(SUM(si.quantity), 0) AS written_off
       FROM products p
       LEFT JOIN stock s ON s.product_id = p.id
       LEFT JOIN productions pr ON pr.product_id = p.id
       LEFT JOIN sale_items si ON si.product_id = p.id
       WHERE p.status = 'active'
       GROUP BY p.id, p.name, p.size, p.min_stock, s.quantity
       ORDER BY p.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/profit', auth(), requireRoles('admin'), async (req, res) => {
  try {
    let { from, to } = req.query;
    if (req.query.period) {
      const range = periodRange(req.query.period);
      if (range) {
        from = range.from;
        to = range.to;
      }
    }
    if (!from || !to) {
      const range = periodRange('month');
      from = range.from;
      to = range.to;
    }

    const [[sales]] = await pool.execute(
      `SELECT COALESCE(SUM(s.total_amount), 0) AS revenue
       FROM sales s WHERE DATE(s.created_at) BETWEEN ? AND ?`,
      [from, to]
    );

    const [[cost]] = await pool.execute(
      `SELECT COALESCE(SUM(si.quantity * p.cost_price), 0) AS cost
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN products p ON p.id = si.product_id
       WHERE DATE(s.created_at) BETWEEN ? AND ?`,
      [from, to]
    );

    const [[debts]] = await pool.execute(
      'SELECT COALESCE(SUM(total_debt), 0) AS client_debt FROM clients'
    );

    const revenue = Number(sales.revenue);
    const costVal = Number(cost.cost);

    res.json({
      from,
      to,
      revenue,
      cost: costVal,
      profit: revenue - costVal,
      client_debt: Number(debts.client_debt),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
