/**
 * Создаёт БД siment и применяет schema + seed.
 * Запуск: npm run db:setup
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'siment';

async function runSqlFile(conn, filePath, useDatabase) {
  let sql = fs.readFileSync(filePath, 'utf8');
  sql = sql.replace(/^USE\s+\w+\s*;/gim, '');
  if (useDatabase) {
    await conn.query(`USE \`${useDatabase}\``);
  }
  await conn.query(sql);
}

async function main() {
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  };

  console.log('Подключение к MySQL...');
  const rootConn = await mysql.createConnection(baseConfig);

  console.log(`Создание базы "${DB_NAME}"...`);
  await rootConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');

  console.log('Применение schema.sql...');
  await runSqlFile(rootConn, schemaPath, DB_NAME);

  console.log('Применение seed.sql...');
  await runSqlFile(rootConn, seedPath, DB_NAME);

  await rootConn.end();
  console.log('Готово! База данных настроена.');
  console.log('Логины: admin / seller / worker — пароль: admin123');
}

main().catch((err) => {
  console.error('Ошибка:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.error('MySQL не запущен. Запустите службу MySQL и повторите: npm run db:setup');
  }
  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('Проверьте DB_USER и DB_PASSWORD в файле backend/.env');
  }
  process.exit(1);
});
