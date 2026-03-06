import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';

export default function App() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">
          <span className="brand-badge">PW</span>
          <div>
            <p className="brand-title">PokeChantier</p>
            <small>WebStat React + TanStack Query</small>
          </div>
        </div>

        <nav>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            end
          >
            Statistiques
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
          >
            Live Map
          </NavLink>
        </nav>
      </header>

      <main className="content-shell">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
