import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

export default function Production() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: '', quantity: '', comment: '' });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    api('/productions').then(setItems).catch((e) => setError(e.message));
    api('/products?active=1').then(setProducts).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/productions', {
        method: 'POST',
        body: {
          product_id: Number(form.product_id),
          quantity: Number(form.quantity),
          comment: form.comment || null,
        },
      });
      setForm({ product_id: '', quantity: '', comment: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Производство"
        subtitle="Добавление готовой продукции на склад"
        action={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Добавить
          </button>
        }
      />
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={save}>
          <h3>Новое производство</h3>
          <div className="form-grid">
            <label>
              Тип блока
              <select
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                required
              >
                <option value="">Выберите</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.size ? `(${p.size})` : ''}
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
            <label className="full">
              Комментарий
              <input value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
          </div>
        </form>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Блок</th>
              <th>Кол-во</th>
              <th>Ответственный</th>
              <th>Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString('ru-RU')}</td>
                <td>
                  {r.product_name}
                  {r.size ? ` (${r.size})` : ''}
                </td>
                <td>{r.quantity} шт</td>
                <td>{r.user_name}</td>
                <td>{r.comment || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
