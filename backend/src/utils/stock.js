const pool = require('../config/db');
const { sendTelegram } = require('./telegram');

async function getStockQuantity(productId, conn) {
  const db = conn || pool;
  const [rows] = await db.execute(
    'SELECT quantity FROM stock WHERE product_id = ?',
    [productId]
  );
  return rows.length ? rows[0].quantity : 0;
}

async function adjustStock(productId, delta, conn) {
  const db = conn || pool;
  await db.execute(
    `INSERT INTO stock (product_id, quantity) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [productId, delta]
  );
}

async function checkLowStock(productId, conn) {
  const db = conn || pool;
  const [rows] = await db.execute(
    `SELECT p.name, p.size, s.quantity, p.min_stock
     FROM products p
     JOIN stock s ON s.product_id = p.id
     WHERE p.id = ?`,
    [productId]
  );
  if (!rows.length) return;
  const row = rows[0];
  const minAlert = row.min_stock || Number(process.env.MIN_STOCK_ALERT || 200);
  if (row.quantity <= minAlert) {
    await sendTelegram(
      `⚠️ <b>Остаток блока низкий</b>\n\n` +
        `Блок: ${row.name}${row.size ? ` (${row.size})` : ''}\n` +
        `Осталось: ${row.quantity} шт\n` +
        `Минимальный остаток: ${minAlert} шт`
    );
  }
}

module.exports = { getStockQuantity, adjustStock, checkLowStock };
