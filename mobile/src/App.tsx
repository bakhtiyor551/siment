import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonPage, IonSpinner, IonContent, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Tabs from './pages/Tabs';
import { getDefaultTabPath } from './utils/tabs';

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

function LoadingScreen() {
  return (
    <IonPage>
      <IonContent className="loading-center">
        <IonSpinner name="crescent" />
      </IonContent>
    </IonPage>
  );
}

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const home = user ? getDefaultTabPath(user.role) : '/login';

  return (
    <IonRouterOutlet>
      <Route exact path="/login" component={Login} />
      <Route
        exact
        path="/tabs"
        render={() => <Redirect to={home} />}
      />
      <Route
        path="/tabs"
        render={() => (user ? <Tabs /> : <Redirect to="/login" />)}
      />
      <Route exact path="/" render={() => <Redirect to={home} />} />
    </IonRouterOutlet>
  );
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;
