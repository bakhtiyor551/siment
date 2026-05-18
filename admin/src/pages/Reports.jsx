import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

const PERIODS = [
  { value: 'today', label: 'Сегодня' },
  { value: 'yesterday', label: 'Вчера' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
];

export default function Reports() {
  const [period, setPeriod] = useState('today');
  const [sales, setSales] = useState(null);
  const [production, setProduction] = useState(null);
  const [stock, setStock] = useState([]);
  const [profit, setProfit] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    Promise.all([
      api(`/reports/sales?period=${period}`),
      api(`/reports/production?period=${period}`),
      api('/reports/stock'),
      api(`/reports/profit?period=${period}`),
    ])
      .then(([s, p, st, pr]) => {
        setSales(s);
        setProduction(p);
        setStock(st);
        setProfit(pr);
      })
      .catch((e) => setError(e.message));
  }, [period]);

  return (
    <div>
      <PageHeader title="Отчёты" />
      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={period === p.value ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="report-grid">
        <section className="card">
          <h3>Продажи</h3>
          {sales && (
            <ul className="report-list">
              <li>Количество продаж: <strong>{sales.sales_count}</strong></li>
              <li>Блоков продано: <strong>{sales.blocks_sold}</strong></li>
              <li>Сумма: <strong>{sales.total_amount} сом</strong></li>
              <li>Наличные: <strong>{sales.cash} сом</strong></li>
              <li>Переводы: <strong>{sales.transfer} сом</strong></li>
              <li>Долги: <strong>{sales.debt} сом</strong></li>
            </ul>
          )}
        </section>

        <section className="card">
          <h3>Производство</h3>
          {production && (
            <>
              <p>
                Произведено: <strong>{production.total_produced} шт</strong>
              </p>
              <div className="table-wrap mini">
                <table>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Блок</th>
                      <th>Кол-во</th>
                      <th>Кто</th>
                    </tr>
                  </thead>
                  <tbody>
                    {production.items?.slice(0, 10).map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.created_at).toLocaleDateString('ru-RU')}</td>
                        <td>{r.product_name}</td>
                        <td>{r.quantity}</td>
                        <td>{r.user_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <h3>Финансы</h3>
          {profit && (
            <ul className="report-list">
              <li>Выручка: <strong>{profit.revenue} сом</strong></li>
              <li>Себестоимость: <strong>{profit.cost} сом</strong></li>
              <li>Прибыль: <strong className="text-ok">{profit.profit} сом</strong></li>
              <li>Долги клиентов: <strong className="text-warn">{profit.client_debt} сом</strong></li>
            </ul>
          )}
        </section>

        <section className="card full">
          <h3>Склад</h3>
          <div className="table-wrap mini">
            <table>
              <thead>
                <tr>
                  <th>Блок</th>
                  <th>Остаток</th>
                  <th>Поступило</th>
                  <th>Списано</th>
                  <th>Мин.</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((r) => (
                  <tr key={r.id} className={r.balance <= r.min_stock ? 'row-warn' : ''}>
                    <td>{r.name}</td>
                    <td>{r.balance}</td>
                    <td>{r.received}</td>
                    <td>{r.written_off}</td>
                    <td>{r.min_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
