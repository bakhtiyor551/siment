import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

const ROLES = [
  { value: 'admin', label: 'Администратор' },
  { value: 'seller', label: 'Продавец' },
  { value: 'worker', label: 'Производство' },
];

export default function Users() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'seller',
    status: 'active',
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => api('/users').then(setItems).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        const body = { ...form };
        if (!body.password) delete body.password;
        await api(`/users/${editId}`, { method: 'PUT', body });
      } else {
        await api('/users', { method: 'POST', body: form });
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', phone: '', password: '', role: 'seller', status: 'active' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Пользователи"
        action={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Добавить
          </button>
        }
      />
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={save}>
          <h3>{editId ? 'Редактировать' : 'Новый пользователь'}</h3>
          <div className="form-grid">
            <label>
              Имя
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Телефон (логин)
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </label>
            <label>
              Пароль {editId && '(оставьте пустым, чтобы не менять)'}
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editId}
              />
            </label>
            <label>
              Роль
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Статус
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Активен</option>
                <option value="inactive">Неактивен</option>
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
              <th>Имя</th>
              <th>Логин</th>
              <th>Роль</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.phone}</td>
                <td>{ROLES.find((r) => r.value === u.role)?.label || u.role}</td>
                <td>
                  <span className={`badge ${u.status === 'active' ? 'badge-ok' : 'badge-muted'}`}>
                    {u.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setEditId(u.id);
                      setForm({
                        name: u.name,
                        phone: u.phone,
                        password: '',
                        role: u.role,
                        status: u.status,
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
