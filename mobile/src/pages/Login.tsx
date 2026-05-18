import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonToast,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultTabPath } from '../utils/tabs';
import './Login.css';

const Login: React.FC = () => {
  const { login, user } = useAuth();
  const history = useHistory();
  const [phone, setPhone] = useState('seller');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      history.replace(getDefaultTabPath(user.role));
    }
  }, [user, history]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(phone, password);
      history.replace(getDefaultTabPath(loggedIn.role));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-content" fullscreen>
        <div className="login-wrap">
          <div className="login-logo">🧱</div>
          <h1>Siment</h1>
          <p>Продажа цементных блоков</p>

          <IonList className="login-form">
            <IonItem>
              <IonLabel position="stacked">Логин (телефон)</IonLabel>
              <IonInput value={phone} onIonInput={(e) => setPhone(e.detail.value || '')} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Пароль</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value || '')}
              />
            </IonItem>
          </IonList>

          <IonButton expand="block" onClick={handleLogin} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </IonButton>

          <IonText color="medium" className="login-hint">
            <p>seller / admin123</p>
          </IonText>
        </div>

        <IonToast isOpen={!!error} message={error} duration={3000} color="danger" onDidDismiss={() => setError('')} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
