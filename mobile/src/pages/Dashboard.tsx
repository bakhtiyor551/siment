import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import { api, DashboardStats } from '../api/client';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const load = useCallback(() => {
    return api<DashboardStats>('/reports/dashboard').then(setStats);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async (e: CustomEvent) => {
    await load();
    (e.target as HTMLIonRefresherElement).complete();
  };

  const cards = [
    { label: 'Произведено сегодня', value: stats?.produced_today, suffix: ' шт' },
    { label: 'Продано сегодня', value: stats?.sold_today, suffix: ' шт' },
    { label: 'Остаток на складе', value: stats?.stock_total, suffix: ' шт' },
    { label: 'Продажи сегодня', value: stats?.sales_amount_today, suffix: ' сом' },
    { label: 'Заказов сегодня', value: stats?.orders_today, suffix: '' },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Главная</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="stat-cards">
          {cards.map((c) => (
            <IonCard key={c.label}>
              <IonCardHeader>
                <IonCardTitle className="stat-label">{c.label}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="stat-value">
                  {c.value ?? '—'}
                  {c.suffix}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
