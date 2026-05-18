import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

export default function Stock() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/stock')
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="Склад" subtitle="Остатки по видам блоков" />
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Блок</th>
              <th>Произведено</th>
              <th>Продано</th>
              <th>Остаток</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className={r.balance <= r.min_stock ? 'row-warn' : ''}>
                <td>
                  {r.name}
                  {r.size ? ` (${r.size})` : ''}
                </td>
                <td>{r.produced}</td>
                <td>{r.sold}</td>
                <td>
                  <strong>{r.balance}</strong> {r.unit || 'шт'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
