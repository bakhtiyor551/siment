import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonSpinner, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Tabs from './pages/Tabs';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';

import './theme/variables.css';
import './theme/global.css';

setupIonicReact();

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-center">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  return (
    <IonRouterOutlet>
      <Route exact path="/login" render={() => (user ? <Redirect to="/tabs" /> : <Login />)} />
      <Route path="/tabs" render={() => (user ? <Tabs /> : <Redirect to="/login" />)} />
      <Route exact path="/" render={() => <Redirect to={user ? '/tabs' : '/login'} />} />
    </IonRouterOutlet>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;
