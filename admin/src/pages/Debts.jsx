import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

export default function Debts() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/clients/debts')
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="Долги клиентов" subtitle="Открытые долги по продажам" />
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Дата</th>
              <th>Сумма продажи</th>
              <th>Оплачено</th>
              <th>Долг</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.sale_id}>
                <td>
                  {d.client_name}
                  <br />
                  <small>{d.client_phone}</small>
                </td>
                <td>{new Date(d.created_at).toLocaleString('ru-RU')}</td>
                <td>{d.total_amount} сом</td>
                <td>{d.paid_amount} сом</td>
                <td className="text-warn">{d.debt_amount} сом</td>
                <td>
                  <span className="badge badge-warn">{d.status === 'open' ? 'Открыт' : 'Закрыт'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <p className="empty">Нет открытых долгов</p>}
      </div>
    </div>
  );
}
