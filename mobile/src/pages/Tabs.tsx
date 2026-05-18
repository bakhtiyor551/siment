import { Redirect, Route } from 'react-router-dom';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import {
  addCircleOutline,
  cubeOutline,
  homeOutline,
  listOutline,
  settingsOutline,
  constructOutline,
} from 'ionicons/icons';
import Dashboard from './Dashboard';
import Sale from './Sale';
import Stock from './Stock';
import Production from './Production';
import SalesList from './SalesList';
import Settings from './Settings';
import { useAuth } from '../context/AuthContext';

const Tabs: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const canSell = role === 'admin' || role === 'seller';
  const canProduce = role === 'admin' || role === 'worker';

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/dashboard" component={Dashboard} />
        <Route exact path="/tabs/stock" component={Stock} />
        {canSell && <Route exact path="/tabs/sale" component={Sale} />}
        {canSell && <Route exact path="/tabs/sales" component={SalesList} />}
        {canProduce && <Route exact path="/tabs/production" component={Production} />}
        <Route exact path="/tabs/settings" component={Settings} />
        <Route exact path="/tabs">
          <Redirect
            to={
              role === 'worker'
                ? '/tabs/production'
                : canSell
                  ? '/tabs/dashboard'
                  : '/tabs/stock'
            }
          />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        {role !== 'worker' && (
          <IonTabButton tab="dashboard" href="/tabs/dashboard">
            <IonIcon icon={homeOutline} />
            <IonLabel>Главная</IonLabel>
          </IonTabButton>
        )}
        {canSell && (
          <IonTabButton tab="sale" href="/tabs/sale">
            <IonIcon icon={addCircleOutline} />
            <IonLabel>Продажа</IonLabel>
          </IonTabButton>
        )}
        <IonTabButton tab="stock" href="/tabs/stock">
          <IonIcon icon={cubeOutline} />
          <IonLabel>Склад</IonLabel>
        </IonTabButton>
        {canProduce && (
          <IonTabButton tab="production" href="/tabs/production">
            <IonIcon icon={constructOutline} />
            <IonLabel>Производство</IonLabel>
          </IonTabButton>
        )}
        {canSell && (
          <IonTabButton tab="sales" href="/tabs/sales">
            <IonIcon icon={listOutline} />
            <IonLabel>История</IonLabel>
          </IonTabButton>
        )}
        <IonTabButton tab="settings" href="/tabs/settings">
          <IonIcon icon={settingsOutline} />
          <IonLabel>Ещё</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default Tabs;
