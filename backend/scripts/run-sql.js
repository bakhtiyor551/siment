require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const file = process.argv[2];
if (!file) {
  console.error('Укажите файл: node scripts/run-sql.js database/seed-demo.sql');
  process.exit(1);
}

const DB_NAME = process.env.DB_NAME || 'siment';

(async () => {
  const sqlPath = path.isAbsolute(file) ? file : path.join(__dirname, '..', file);
  let sql = fs.readFileSync(sqlPath, 'utf8');
  sql = sql.replace(/^USE\s+\w+\s*;/gim, '');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
    multipleStatements: true,
  });

  await conn.query(sql);
  await conn.end();
  console.log('OK:', sqlPath);
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
