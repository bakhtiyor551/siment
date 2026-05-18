import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import { api, Product, StockRow } from '../api/client';

const Stock: React.FC = () => {
  const [items, setItems] = useState<StockRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => api<StockRow[]>('/stock').then(setItems), []);

  useEffect(() => {
    load();
    api<Product[]>('/products?active=1').then((list) => {
      setProducts(list);
      if (list.length) setProductId(String(list[0].id));
    });
  }, [load]);

  const refresh = async (e: CustomEvent) => {
    await load();
    (e.target as HTMLIonRefresherElement).complete();
  };

  const addToStock = async () => {
    setError('');
    setSuccess('');
    const qty = Number(addQty);
    const pid = productId || (products[0] ? String(products[0].id) : '');
    if (!pid || !qty || qty <= 0) {
      setError('Укажите количество (шт)');
      return;
    }
    try {
      await api('/stock/add', {
        method: 'POST',
        body: { product_id: Number(pid), quantity: qty },
      });
      setSuccess(`Добавлено ${qty} шт на склад`);
      setAddQty('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  const singleProduct = products.length === 1 ? products[0] : null;

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

        <IonCard className="stock-add-card">
          <IonCardHeader>
            <IonCardTitle>Добавить на склад</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {singleProduct ? (
              <p className="stock-product-name">
                {singleProduct.name}
                {singleProduct.size ? ` (${singleProduct.size})` : ''}
              </p>
            ) : (
              <IonItem className="stock-select">
                <IonLabel position="stacked">Товар</IonLabel>
                <IonSelect value={productId} onIonChange={(e) => setProductId(e.detail.value)}>
                  {products.map((p) => (
                    <IonSelectOption key={p.id} value={String(p.id)}>
                      {p.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            )}
            <IonItem>
              <IonLabel position="stacked">Количество (шт)</IonLabel>
              <IonInput
                type="number"
                inputMode="numeric"
                value={addQty}
                onIonInput={(e) => setAddQty(e.detail.value || '')}
              />
            </IonItem>
            <IonButton expand="block" onClick={addToStock}>
              Добавить
            </IonButton>
          </IonCardContent>
        </IonCard>

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

        <IonToast isOpen={!!error} message={error} color="danger" duration={3000} onDidDismiss={() => setError('')} />
        <IonToast isOpen={!!success} message={success} color="success" duration={2500} onDidDismiss={() => setSuccess('')} />
      </IonContent>
    </IonPage>
  );
};

export default Stock;
