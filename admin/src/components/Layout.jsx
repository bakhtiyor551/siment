import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Главная', icon: '📊', roles: ['admin', 'seller', 'worker'] },
  { to: '/products', label: 'Блоки', icon: '🧱', roles: ['admin'] },
  { to: '/production', label: 'Производство', icon: '🏭', roles: ['admin', 'worker'] },
  { to: '/stock', label: 'Склад', icon: '📦', roles: ['admin', 'seller', 'worker'] },
  { to: '/sales', label: 'Продажи', icon: '💰', roles: ['admin', 'seller'] },
  { to: '/debts', label: 'Долги', icon: '📋', roles: ['admin', 'seller'] },
  { to: '/reports', label: 'Отчёты', icon: '📈', roles: ['admin'] },
  { to: '/users', label: 'Пользователи', icon: '⚙️', roles: ['admin'] },
];

const ROLE_LABELS = { admin: 'Администратор', seller: 'Продавец', worker: 'Производство' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = NAV.filter((item) => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🧱</span>
          <div>
            <strong>Siment</strong>
            <small>Учёт блоков</small>
          </div>
        </div>
        <nav className="nav">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <strong>{user?.name}</strong>
            <span>{ROLE_LABELS[user?.role] || user?.role}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
