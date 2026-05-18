import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

const PAYMENT_TYPES = [
  { value: 'cash', label: 'Наличные' },
  { value: 'transfer', label: 'Перевод' },
  { value: 'debt', label: 'Долг' },
  { value: 'mixed', label: 'Смешанная' },
];

const PAYMENT_LABELS = Object.fromEntries(PAYMENT_TYPES.map((p) => [p.value, p.label]));

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    product_id: '',
    quantity: '',
    price: '',
    discount: 0,
    payment_type: 'cash',
    paid_amount: '',
    comment: '',
  });

  const load = () => {
    api('/sales').then(setSales).catch((e) => setError(e.message));
    api('/products?active=1').then(setProducts);
  };

  useEffect(() => {
    load();
  }, []);

  const onProductChange = (id) => {
    const p = products.find((x) => String(x.id) === id);
    setForm((f) => ({
      ...f,
      product_id: id,
      price: p ? String(p.sale_price) : '',
    }));
  };

  const lineTotal = () => {
    const q = Number(form.quantity) || 0;
    const p = Number(form.price) || 0;
    const d = Number(form.discount) || 0;
    return Math.max(0, q * p - d);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const total = lineTotal();
      let paid = Number(form.paid_amount);
      if (form.payment_type === 'cash' || form.payment_type === 'transfer') paid = total;
      if (form.payment_type === 'debt') paid = 0;

      await api('/sales', {
        method: 'POST',
        body: {
          client_name: form.client_name,
          client_phone: form.client_phone,
          payment_type: form.payment_type,
          paid_amount: paid,
          discount: Number(form.discount) || 0,
          comment: form.comment || null,
          items: [
            {
              product_id: Number(form.product_id),
              quantity: Number(form.quantity),
              price: Number(form.price),
            },
          ],
        },
      });
      setShowForm(false);
      setForm({
        client_name: '',
        client_phone: '',
        product_id: '',
        quantity: '',
        price: '',
        discount: 0,
        payment_type: 'cash',
        paid_amount: '',
        comment: '',
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Продажи"
        action={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Новая продажа
          </button>
        }
      />
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={save}>
          <h3>Оформить продажу</h3>
          <div className="form-grid">
            <label>
              Клиент
              <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
            </label>
            <label>
              Телефон
              <input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
            </label>
            <label>
              Тип блока
              <select value={form.product_id} onChange={(e) => onProductChange(e.target.value)} required>
                <option value="">Выберите</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Количество
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </label>
            <label>
              Цена за 1 шт
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </label>
            <label>
              Скидка
              <input
                type="number"
                step="0.01"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </label>
            <label>
              Способ оплаты
              <select
                value={form.payment_type}
                onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
              >
                {PAYMENT_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            {form.payment_type === 'mixed' && (
              <label>
                Оплачено
                <input
                  type="number"
                  step="0.01"
                  value={form.paid_amount}
                  onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
                />
              </label>
            )}
            <label className="full">
              Комментарий
              <input value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
            </label>
          </div>
          <p className="total-line">
            Итого: <strong>{lineTotal()} сомони</strong>
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Оформить
            </button>
          </div>
        </form>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Клиент</th>
              <th>Товары</th>
              <th>Сумма</th>
              <th>Оплата</th>
              <th>Продавец</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.created_at).toLocaleString('ru-RU')}</td>
                <td>
                  {s.client_name || '—'}
                  <br />
                  <small>{s.client_phone}</small>
                </td>
                <td>
                  {s.items?.map((i) => (
                    <div key={i.id}>
                      {i.product_name} × {i.quantity}
                    </div>
                  ))}
                </td>
                <td>{s.total_amount} сом</td>
                <td>
                  {PAYMENT_LABELS[s.payment_type]}
                  {s.debt_amount > 0 && (
                    <div className="text-warn">Долг: {s.debt_amount}</div>
                  )}
                </td>
                <td>{s.seller_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
