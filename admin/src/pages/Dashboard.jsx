import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

function StatCard({ label, value, suffix = '' }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/reports/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="Главная" subtitle="Сводка за сегодня" />
      {error && <div className="alert alert-error">{error}</div>}
      <div className="stat-grid">
        <StatCard label="Сегодня произведено" value={data?.produced_today ?? '—'} suffix=" шт" />
        <StatCard label="Сегодня продано" value={data?.sold_today ?? '—'} suffix=" шт" />
        <StatCard label="Остаток на складе" value={data?.stock_total ?? '—'} suffix=" шт" />
        <StatCard label="Продажи за сегодня" value={data?.sales_amount_today ?? '—'} suffix=" сом" />
        <StatCard label="Заказов за сегодня" value={data?.orders_today ?? '—'} />
      </div>
    </div>
  );
}
