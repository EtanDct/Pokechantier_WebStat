import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import serverIcon from '../server-icon.png';

const backgroundSprites = [
  {
    id: 'mewtwo',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/150.png',
    slot: 'sprite-1',
  },
  {
    id: 'charizard',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/6.png',
    slot: 'sprite-2',
  },
  {
    id: 'blastoise',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/9.png',
    slot: 'sprite-3',
  },
  {
    id: 'gengar',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/94.png',
    slot: 'sprite-4',
  },
  {
    id: 'lucario',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/448.png',
    slot: 'sprite-5',
  },
  {
    id: 'mew',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/151.png',
    slot: 'sprite-6',
  },
  {
    id: 'pikachu',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/25.png',
    slot: 'sprite-7',
  },
  {
    id: 'snorlax',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/143.png',
    slot: 'sprite-8',
  },
  {
    id: 'rayquaza',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/384.png',
    slot: 'sprite-9',
  },
  {
    id: 'gardevoir',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/282.png',
    slot: 'sprite-10',
  },
];

export default function App() {
  return (
    <div className="app-shell">
      <div className="ambient-backdrop" aria-hidden="true">
        <div className="pokemon-backdrop">
          {backgroundSprites.map((sprite) => (
            <img
              key={sprite.id}
              className={`pokemon-sprite ${sprite.slot}`}
              src={sprite.src}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          ))}
        </div>
      </div>

      <header className="top-nav">
        <div className="brand">
          <img src={serverIcon} alt="Server Icon" className="brand-icon" />
          <div>
            <p className="brand-title">PokeChantier</p>
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
