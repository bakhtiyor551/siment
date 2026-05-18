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
  IonTextarea,
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
  const [products, setProducts] = useState<Product[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentType, setPaymentType] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api<Product[]>('/products?active=1').then(setProducts);
  }, []);

  const total = useMemo(() => {
    const q = Number(quantity) || 0;
    const p = Number(price) || 0;
    const d = Number(discount) || 0;
    return Math.max(0, q * p - d);
  }, [quantity, price, discount]);

  const onProductChange = (id: string) => {
    setProductId(id);
    const p = products.find((x) => String(x.id) === id);
    if (p) setPrice(String(p.sale_price));
  };

  const submit = async () => {
    setError('');
    setSuccess('');
    try {
      let paid = Number(paidAmount);
      if (paymentType === 'cash' || paymentType === 'transfer') paid = total;
      if (paymentType === 'debt') paid = 0;

      await api('/sales', {
        method: 'POST',
        body: {
          client_name: clientName,
          client_phone: clientPhone,
          payment_type: paymentType,
          paid_amount: paid,
          discount: Number(discount) || 0,
          comment: comment || null,
          items: [
            {
              product_id: Number(productId),
              quantity: Number(quantity),
              price: Number(price),
            },
          ],
        },
      });

      setSuccess(`Продажа оформлена: ${total} сомони`);
      setClientName('');
      setClientPhone('');
      setProductId('');
      setQuantity('');
      setPrice('');
      setDiscount('0');
      setPaidAmount('');
      setComment('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Новая продажа</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="stacked">Клиент</IonLabel>
            <IonInput value={clientName} onIonInput={(e) => setClientName(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Телефон</IonLabel>
            <IonInput type="tel" value={clientPhone} onIonInput={(e) => setClientPhone(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Тип блока</IonLabel>
            <IonSelect value={productId} onIonChange={(e) => onProductChange(e.detail.value)}>
              <IonSelectOption value="">Выберите</IonSelectOption>
              {products.map((p) => (
                <IonSelectOption key={p.id} value={String(p.id)}>
                  {p.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Количество</IonLabel>
            <IonInput type="number" value={quantity} onIonInput={(e) => setQuantity(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Цена за 1 шт</IonLabel>
            <IonInput type="number" value={price} onIonInput={(e) => setPrice(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Скидка</IonLabel>
            <IonInput type="number" value={discount} onIonInput={(e) => setDiscount(e.detail.value || '')} />
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
              <IonLabel position="stacked">Оплачено</IonLabel>
              <IonInput type="number" value={paidAmount} onIonInput={(e) => setPaidAmount(e.detail.value || '')} />
            </IonItem>
          )}
          <IonItem>
            <IonLabel position="stacked">Комментарий</IonLabel>
            <IonTextarea value={comment} onIonInput={(e) => setComment(e.detail.value || '')} />
          </IonItem>
        </IonList>

        <p className="sale-total">
          Итого: <strong>{total} сомони</strong>
        </p>

        <IonButton expand="block" onClick={submit}>
          Оформить продажу
        </IonButton>

        <IonToast isOpen={!!error} message={error} color="danger" duration={4000} onDidDismiss={() => setError('')} />
        <IonToast isOpen={!!success} message={success} color="success" duration={3000} onDidDismiss={() => setSuccess('')} />
      </IonContent>
    </IonPage>
  );
};

export default Sale;
