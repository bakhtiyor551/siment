require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const hash = '$2a$10$FaGdAIBC00eoJZ.Mc86eU.3YD7bJ8Idk4NVX0rB5zY06uZCdh/2k.';

mysql
  .createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siment',
  })
  .then(async (c) => {
    await c.execute(
      `INSERT INTO users (name, phone, password, role, status)
       VALUES ('Администратор', 'admin', ?, 'admin', 'active')
       ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role), status = VALUES(status)`,
      [hash]
    );
    const [rows] = await c.execute('SELECT phone, role FROM users ORDER BY id');
    console.log(rows);
    await c.end();
  });
