// Single API entrypoint used everywhere in the app.
// Calls go through Vite proxy to avoid browser CORS issues.
const API_BASE_URL = '/api';

async function request(path, init = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${cleanPath}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || `Erreur HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function withRefresh(refresh) {
  return refresh ? '?refresh=true' : '';
}

export const queryKeys = {
  health: ['health'],
  players: ['players'],
  leaderboard: ['leaderboard'],
  playerProfile: (uuid) => ['player-profile', uuid],
  playerStats: (uuid) => ['player-stats', uuid],
  pokedexSummary: (uuid) => ['pokedex-summary', uuid],
};

export const pokeApi = {
  getHealth: () => request('/health'),
  getPlayers: (refresh = false) => request(`/players${withRefresh(refresh)}`),
  getLeaderboard: (refresh = false) => request(`/leaderboard${withRefresh(refresh)}`),
  getPlayerProfile: (uuid) => request(`/players/${uuid}/profile`),
  getPlayerStats: (uuid) => request(`/stats/${uuid}`),
  getPokedexSummary: (uuid) => request(`/pokedex/${uuid}/summary`),
};
