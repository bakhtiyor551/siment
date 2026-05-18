import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Production from './pages/Production';
import Stock from './pages/Stock';
import Sales from './pages/Sales';
import Debts from './pages/Debts';
import Reports from './pages/Reports';
import Users from './pages/Users';
import './App.css';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Загрузка...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Загрузка...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="products"
          element={
            <PrivateRoute roles={['admin']}>
              <Products />
            </PrivateRoute>
          }
        />
        <Route
          path="production"
          element={
            <PrivateRoute roles={['admin', 'worker']}>
              <Production />
            </PrivateRoute>
          }
        />
        <Route path="stock" element={<Stock />} />
        <Route
          path="sales"
          element={
            <PrivateRoute roles={['admin', 'seller']}>
              <Sales />
            </PrivateRoute>
          }
        />
        <Route
          path="debts"
          element={
            <PrivateRoute roles={['admin', 'seller']}>
              <Debts />
            </PrivateRoute>
          }
        />
        <Route
          path="reports"
          element={
            <PrivateRoute roles={['admin']}>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="users"
          element={
            <PrivateRoute roles={['admin']}>
              <Users />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
