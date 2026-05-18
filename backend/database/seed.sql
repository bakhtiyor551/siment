USE siment;

-- Пароль: admin123
INSERT INTO users (name, phone, password, role, status)
VALUES (
  'Администратор',
  'admin',
  '$2a$10$FaGdAIBC00eoJZ.Mc86eU.3YD7bJ8Idk4NVX0rB5zY06uZCdh/2k.',
  'admin',
  'active'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (name, phone, password, role, status)
VALUES (
  'Продавец',
  'seller',
  '$2a$10$FaGdAIBC00eoJZ.Mc86eU.3YD7bJ8Idk4NVX0rB5zY06uZCdh/2k.',
  'seller',
  'active'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (name, phone, password, role, status)
VALUES (
  'Работник',
  'worker',
  '$2a$10$FaGdAIBC00eoJZ.Mc86eU.3YD7bJ8Idk4NVX0rB5zY06uZCdh/2k.',
  'worker',
  'active'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);
