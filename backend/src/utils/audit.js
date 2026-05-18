const pool = require('../config/db');

async function logAction(userId, action, entityType, entityId, details, conn) {
  const db = conn || pool;
  await db.execute(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?)`,
    [userId || null, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null]
  );
}

module.exports = { logAction };
