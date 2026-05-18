import {
  IonBadge,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import { api, SaleRow } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Наличные',
  transfer: 'Перевод',
  debt: 'Долг',
  mixed: 'Смешанная',
};

const SalesList: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleRow[]>([]);

  const load = useCallback(() => api<SaleRow[]>('/sales').then(setSales), []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async (e: CustomEvent) => {
    await load();
    (e.target as HTMLIonRefresherElement).complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{user?.role === 'seller' ? 'Мои продажи' : 'Продажи'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent />
        </IonRefresher>
        <IonList>
          {sales.map((s) => (
            <IonItem key={s.id}>
              <IonLabel>
                <h2>{s.client_name || 'Без клиента'}</h2>
                <p>
                  {s.items?.map((i) => `${i.product_name} ×${i.quantity}`).join(', ')}
                </p>
                <p>
                  {new Date(s.created_at).toLocaleString('ru-RU')} · {PAYMENT_LABELS[s.payment_type]}
                </p>
              </IonLabel>
              <IonNote slot="end">
                <div>{s.total_amount} сом</div>
                {s.debt_amount > 0 && (
                  <IonBadge color="warning">долг {s.debt_amount}</IonBadge>
                )}
              </IonNote>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default SalesList;
