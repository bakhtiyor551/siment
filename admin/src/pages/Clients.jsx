import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

export default function Clients() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', comment: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => api('/clients').then(setItems).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api(`/clients/${editId}`, { method: 'PUT', body: form });
      } else {
        await api('/clients', { method: 'POST', body: form });
      }
      setShowForm(false);
      setForm({ name: '', phone: '', address: '', comment: '' });
      setEditId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Клиенты"
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditId(null);
              setForm({ name: '', phone: '', address: '', comment: '' });
              setShowForm(true);
            }}
          >
            + Добавить
          </button>
        }
      />
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={save}>
          <h3>{editId ? 'Редактировать' : 'Новый клиент'}</h3>
          <div className="form-grid">
            <label>
              Имя
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Телефон
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Адрес
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
              <th>Имя</th>
              <th>Телефон</th>
              <th>Покупки</th>
              <th>Долг</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.total_purchases} сом</td>
                <td className={c.total_debt > 0 ? 'text-warn' : ''}>{c.total_debt} сом</td>
                <td>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setEditId(c.id);
                      setForm({
                        name: c.name,
                        phone: c.phone || '',
                        address: c.address || '',
                        comment: c.comment || '',
                      });
                      setShowForm(true);
                    }}
                  >
                    Изменить
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
