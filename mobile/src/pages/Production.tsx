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
import { useEffect, useState } from 'react';
import { api, Product } from '../api/client';

const Production: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api<Product[]>('/products?active=1').then(setProducts);
  }, []);

  const submit = async () => {
    setError('');
    setSuccess('');
    try {
      await api('/productions', {
        method: 'POST',
        body: {
          product_id: Number(productId),
          quantity: Number(quantity),
          comment: comment || null,
        },
      });
      setSuccess('Производство добавлено на склад');
      setQuantity('');
      setComment('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Производство</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="stacked">Тип блока</IonLabel>
            <IonSelect value={productId} onIonChange={(e) => setProductId(e.detail.value)}>
              <IonSelectOption value="">Выберите</IonSelectOption>
              {products.map((p) => (
                <IonSelectOption key={p.id} value={String(p.id)}>
                  {p.name} {p.size ? `(${p.size})` : ''}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Количество</IonLabel>
            <IonInput type="number" value={quantity} onIonInput={(e) => setQuantity(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Комментарий</IonLabel>
            <IonTextarea value={comment} onIonInput={(e) => setComment(e.detail.value || '')} />
          </IonItem>
        </IonList>
        <IonButton expand="block" className="ion-margin-top" onClick={submit}>
          Добавить на склад
        </IonButton>
        <IonToast isOpen={!!error} message={error} color="danger" duration={3000} onDidDismiss={() => setError('')} />
        <IonToast isOpen={!!success} message={success} color="success" duration={2500} onDidDismiss={() => setSuccess('')} />
      </IonContent>
    </IonPage>
  );
};

export default Production;
