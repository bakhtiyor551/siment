import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { api, Product } from '../api/client';

const PAYMENTS = [
  { value: 'cash', label: 'Наличные' },
  { value: 'transfer', label: 'Перевод' },
  { value: 'debt', label: 'Долг' },
  { value: 'mixed', label: 'Смешанная' },
];

const Sale: React.FC = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api<Product[]>('/products?active=1').then((list) => {
      if (list.length) setProduct(list[0]);
    });
  }, []);

  const unitPrice = product ? Number(product.sale_price) : 0;

  const total = useMemo(() => {
    const q = Number(quantity) || 0;
    return Math.max(0, q * unitPrice);
  }, [quantity, unitPrice]);

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!product) {
      setError('Товар не настроен. Добавьте блок в админке.');
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Укажите количество');
      return;
    }

    try {
      let paid = Number(paidAmount);
      if (paymentType === 'cash' || paymentType === 'transfer') paid = total;
      if (paymentType === 'debt') paid = 0;

      await api('/sales', {
        method: 'POST',
        body: {
          payment_type: paymentType,
          paid_amount: paid,
          discount: 0,
          items: [
            {
              product_id: product.id,
              quantity: qty,
              price: unitPrice,
            },
          ],
        },
      });

      setSuccess(`Продажа: ${qty} шт · ${total} сомони`);
      setQuantity('');
      setPaidAmount('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Продажа</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {product ? (
          <IonList>
            <IonItem lines="none">
              <IonLabel>
                <h2>{product.name}</h2>
                {product.size && <p>Размер: {product.size}</p>}
                <p className="price-fixed">
                  Цена: <strong>{unitPrice} сомони / шт</strong>
                </p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Количество (шт)</IonLabel>
              <IonInput
                type="number"
                inputMode="numeric"
                value={quantity}
                onIonInput={(e) => setQuantity(e.detail.value || '')}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Способ оплаты</IonLabel>
              <IonSelect value={paymentType} onIonChange={(e) => setPaymentType(e.detail.value)}>
                {PAYMENTS.map((p) => (
                  <IonSelectOption key={p.value} value={p.value}>
                    {p.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            {paymentType === 'mixed' && (
              <IonItem>
                <IonLabel position="stacked">Оплачено (сомони)</IonLabel>
                <IonInput
                  type="number"
                  value={paidAmount}
                  onIonInput={(e) => setPaidAmount(e.detail.value || '')}
                />
              </IonItem>
            )}
          </IonList>
        ) : (
          <IonText color="medium">
            <p className="ion-padding">Нет активного товара. Обратитесь к администратору.</p>
          </IonText>
        )}

        <p className="sale-total">
          Итого: <strong>{total} сомони</strong>
        </p>

        <IonButton expand="block" onClick={submit} disabled={!product}>
          Оформить
        </IonButton>

        <IonToast isOpen={!!error} message={error} color="danger" duration={4000} onDidDismiss={() => setError('')} />
        <IonToast isOpen={!!success} message={success} color="success" duration={3000} onDidDismiss={() => setSuccess('')} />
      </IonContent>
    </IonPage>
  );
};

export default Sale;
