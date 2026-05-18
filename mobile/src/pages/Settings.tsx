import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  seller: 'Продавец',
  worker: 'Работник производства',
};

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.replace('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Настройки</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonListHeader>Профиль</IonListHeader>
          <IonItem>
            <IonLabel>
              <h2>{user?.name}</h2>
              <p>{ROLE_LABELS[user?.role || ''] || user?.role}</p>
              <p>{user?.phone}</p>
            </IonLabel>
          </IonItem>
        </IonList>

        <IonList>
          <IonListHeader>Приложение</IonListHeader>
          <IonItem>
            <IonLabel>
              <p>API</p>
              <h3>{import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}</h3>
            </IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonLabel color="medium">
              <p>Для телефона укажите IP компьютера в .env (VITE_API_URL)</p>
            </IonLabel>
          </IonItem>
        </IonList>

        <div className="ion-padding">
          <IonButton expand="block" color="danger" onClick={handleLogout}>
            Выйти
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
