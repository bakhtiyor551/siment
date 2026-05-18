const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { auth, requireRoles } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/', auth(), requireRoles('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, phone, role, status, created_at FROM users ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', auth(), requireRoles('admin'), async (req, res) => {
  try {
    const { name, phone, password, role, status } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Заполните имя, телефон и пароль' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, phone, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, phone.trim(), hash, role || 'seller', status || 'active']
    );
    await logAction(req.user.id, 'create', 'user', result.insertId, { phone, role });
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Пользователь с таким телефоном уже есть' });
    }
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/:id', auth(), requireRoles('admin'), async (req, res) => {
  try {
    const { name, phone, password, role, status } = req.body;

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.execute(
        'UPDATE users SET name=?, phone=?, password=?, role=?, status=? WHERE id=?',
        [name, phone.trim(), hash, role, status, req.params.id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET name=?, phone=?, role=?, status=? WHERE id=?',
        [name, phone.trim(), role, status, req.params.id]
      );
    }

    await logAction(req.user.id, 'update', 'user', Number(req.params.id), { role, status });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
