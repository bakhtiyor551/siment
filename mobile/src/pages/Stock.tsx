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
import { api, StockRow } from '../api/client';

const Stock: React.FC = () => {
  const [items, setItems] = useState<StockRow[]>([]);

  const load = useCallback(() => api<StockRow[]>('/stock').then(setItems), []);

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
          <IonTitle>Склад</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent />
        </IonRefresher>
        <IonList>
          {items.map((r) => (
            <IonItem key={r.id}>
              <IonLabel>
                <h2>
                  {r.name}
                  {r.size ? ` (${r.size})` : ''}
                </h2>
                <p>
                  Произведено: {r.produced} · Продано: {r.sold}
                </p>
              </IonLabel>
              <IonNote slot="end" className="stock-qty">
                {r.balance} {r.unit || 'шт'}
                {r.min_stock !== undefined && r.balance <= r.min_stock && (
                  <IonBadge color="warning" className="low-badge">
                    мало
                  </IonBadge>
                )}
              </IonNote>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Stock;
