import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

const empty = {
  name: '',
  size: '',
  sale_price: '',
  cost_price: '',
  unit: 'шт',
  min_stock: 200,
  status: 'active',
};

export default function Products() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => api('/products').then(setItems).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      size: p.size || '',
      sale_price: p.sale_price,
      cost_price: p.cost_price,
      unit: p.unit || 'шт',
      min_stock: p.min_stock,
      status: p.status,
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api(`/products/${editId}`, { method: 'PUT', body: form });
      } else {
        await api('/products', { method: 'POST', body: form });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivateProduct = async (p) => {
    setError('');
    try {
      await api(`/products/${p.id}`, {
        method: 'PUT',
        body: {
          name: p.name,
          size: p.size || '',
          sale_price: p.sale_price,
          cost_price: p.cost_price,
          unit: p.unit || 'шт',
          min_stock: p.min_stock,
          status: 'inactive',
        },
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeProduct = async (p) => {
    if (!confirm(`Удалить «${p.name}»?\n\nЗаписи производства будут удалены вместе с товаром.`)) {
      return;
    }
    setError('');
    try {
      await api(`/products/${p.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      const msg = err.message || 'Не удалось удалить';
      setError(msg);
      if (msg.includes('продажи') && confirm(`${msg}\n\nОтключить товар (неактивный)?`)) {
        await deactivateProduct(p);
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Справочник блоков"
        action={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + Добавить
          </button>
        }
      />
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={save}>
          <h3>{editId ? 'Редактировать' : 'Новый блок'}</h3>
          <div className="form-grid">
            <label>
              Название
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Размер
              <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            </label>
            <label>
              Цена продажи
              <input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} required />
            </label>
            <label>
              Себестоимость
              <input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} required />
            </label>
            <label>
              Единица
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </label>
            <label>
              Мин. остаток
              <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
            </label>
            <label>
              Статус
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Активный</option>
                <option value="inactive">Неактивный</option>
              </select>
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
              <th>Название</th>
              <th>Размер</th>
              <th>Цена</th>
              <th>Себест.</th>
              <th>Мин.</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.size || '—'}</td>
                <td>{p.sale_price} сом</td>
                <td>{p.cost_price} сом</td>
                <td>{p.min_stock}</td>
                <td>
                  <span className={`badge ${p.status === 'active' ? 'badge-ok' : 'badge-muted'}`}>
                    {p.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="actions">
                  <button type="button" className="btn-link" onClick={() => openEdit(p)}>
                    Изменить
                  </button>
                  <button type="button" className="btn-link danger" onClick={() => removeProduct(p)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
