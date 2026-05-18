const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function auth(required = true) {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      if (required) return res.status(401).json({ error: 'Требуется авторизация' });
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await pool.execute(
        'SELECT id, name, phone, role, status FROM users WHERE id = ?',
        [payload.userId]
      );
      if (!rows.length || rows[0].status !== 'active') {
        return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
      }
      req.user = rows[0];
      next();
    } catch {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
  };
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
}

module.exports = { auth, requireRoles };
