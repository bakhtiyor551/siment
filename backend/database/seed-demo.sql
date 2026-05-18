USE siment;

INSERT INTO products (name, size, sale_price, cost_price, unit, min_stock, status) VALUES
('Блок 20x20x40', '20x20x40', 3.00, 2.00, 'шт', 200, 'active'),
('Блок 15x20x40', '15x20x40', 2.50, 1.80, 'шт', 150, 'active'),
('Блок 10x20x40', '10x20x40', 2.00, 1.50, 'шт', 100, 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO stock (product_id, quantity)
SELECT id, 0 FROM products
ON DUPLICATE KEY UPDATE quantity = quantity;

UPDATE stock s
JOIN products p ON p.id = s.product_id
SET s.quantity = CASE p.name
  WHEN 'Блок 20x20x40' THEN 1800
  WHEN 'Блок 15x20x40' THEN 2000
  WHEN 'Блок 10x20x40' THEN 1200
  ELSE s.quantity
END;

INSERT INTO productions (product_id, quantity, user_id, comment)
SELECT p.id, 5000, u.id, 'Начальный остаток'
FROM products p
CROSS JOIN users u
WHERE u.phone = 'worker' AND p.name = 'Блок 20x20x40'
LIMIT 1;

INSERT INTO productions (product_id, quantity, user_id, comment)
SELECT p.id, 3000, u.id, 'Начальный остаток'
FROM products p
CROSS JOIN users u
WHERE u.phone = 'worker' AND p.name = 'Блок 15x20x40'
LIMIT 1;

INSERT INTO clients (name, phone, address, comment) VALUES
('Али', '900000000', 'Душанбе', 'Постоянный клиент'),
('Бахтиёр', '918000000', NULL, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);
