import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pokeApi, queryKeys } from '../api/pokechantierApi';
import StatCard from '../components/StatCard';
import TabBar from '../components/TabBar';

const numberFormat = new Intl.NumberFormat('fr-FR');

const tabs = [
  { id: 'overview', label: 'Vue globale' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'players', label: 'Profils joueurs' },
];

const leaderboardMetrics = [
  { id: 'rank', label: 'Rang API (par défaut)' },
  { id: 'caught', label: 'Pokémon capturés' },
  { id: 'seen', label: 'Pokémon vus' },
  { id: 'completion', label: 'Complétion (%)' },
  { id: 'shinyCaught', label: 'Shiny capturés' },
  { id: 'shinySeen', label: 'Shiny vus' },
  { id: 'count', label: 'Entrées Pokédex' },
];

function formatMetric(entry, metric) {
  if (metric === 'completion') {
    return `${Number(entry.completion || 0).toFixed(2)}%`;
  }

  if (metric === 'rank') {
    return `#${entry.rank}`;
  }

  return numberFormat.format(entry[metric] || 0);
}

function formatDistanceKm(value) {
  return `${Number(value || 0).toFixed(2)} km`;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState('caught');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedPlayerUuid, setSelectedPlayerUuid] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const [isServerRefreshing, setIsServerRefreshing] = useState(false);

  const playersQuery = useQuery({
    queryKey: queryKeys.players,
    queryFn: () => pokeApi.getPlayers(),
  });

  const leaderboardQuery = useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: () => pokeApi.getLeaderboard(),
  });

  const healthQuery = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => pokeApi.getHealth(),
    refetchInterval: 60_000,
  });

  const players = playersQuery.data?.players || [];
  const ranking = leaderboardQuery.data?.ranking || [];

  useEffect(() => {
    if (!selectedPlayerUuid && players.length > 0) {
      setSelectedPlayerUuid(players[0].uuid);
    }
  }, [players, selectedPlayerUuid]);

  const profileQuery = useQuery({
    queryKey: queryKeys.playerProfile(selectedPlayerUuid),
    queryFn: () => pokeApi.getPlayerProfile(selectedPlayerUuid),
    enabled: Boolean(selectedPlayerUuid),
  });

  const rankedRows = useMemo(() => {
    const entries = [...ranking];

    if (selectedMetric === 'rank') {
      entries.sort((a, b) =>
        sortDirection === 'asc' ? a.rank - b.rank : b.rank - a.rank,
      );
    } else {
      entries.sort((a, b) => {
        const valueA = Number(a[selectedMetric] || 0);
        const valueB = Number(b[selectedMetric] || 0);

        if (valueA !== valueB) {
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }

        if (b.caught !== a.caught) return b.caught - a.caught;
        if (b.seen !== a.seen) return b.seen - a.seen;
        return a.uuid.localeCompare(b.uuid);
      });
    }

    return entries.map((entry, index) => ({
      ...entry,
      dynamicRank: index + 1,
    }));
  }, [ranking, selectedMetric, sortDirection]);

  const bestPlayer = ranking[0] || null;

  async function refreshServerCache() {
    setIsServerRefreshing(true);
    setRefreshError('');

    try {
      const [playersPayload, leaderboardPayload] = await Promise.all([
        pokeApi.getPlayers(true),
        pokeApi.getLeaderboard(true),
      ]);

      queryClient.setQueryData(queryKeys.players, playersPayload);
      queryClient.setQueryData(queryKeys.leaderboard, leaderboardPayload);
      await Promise.all([playersQuery.refetch(), leaderboardQuery.refetch()]);
    } catch (error) {
      setRefreshError(error.message || 'Impossible de rafraîchir les données.');
    } finally {
      setIsServerRefreshing(false);
    }
  }

  const profile = profileQuery.data;

  return (
    <div className="page-stack">
      <header className="hero">
        <div>
          <p className="eyebrow">Cobblemon analytics</p>
          <h1>PokeChantier WebStat</h1>
          <p>
            Tableau centralisé des stats joueurs, du Pokédex global et des
            performances serveur.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={refreshServerCache}
          disabled={isServerRefreshing}
        >
          {isServerRefreshing
            ? 'Rafraîchissement en cours...'
            : 'Forcer le refresh serveur'}
        </button>
      </header>

      {refreshError ? <p className="error-banner">{refreshError}</p> : null}

      <section className="stats-grid">
        <StatCard
          label="Joueurs connus"
          value={numberFormat.format(players.length)}
          hint="source: /api/players"
          tone="teal"
        />
        <StatCard
          label="Joueurs classés"
          value={numberFormat.format(ranking.length)}
          hint="source: /api/leaderboard"
          tone="orange"
        />
        <StatCard
          label="Meilleur taux de complétion"
          value={bestPlayer ? `${bestPlayer.completion.toFixed(2)}%` : '--'}
          hint={bestPlayer ? bestPlayer.name : 'Aucune donnée'}
          tone="olive"
        />
        <StatCard
          label="État API"
          value={healthQuery.data?.status === 'ok' ? 'En ligne' : 'Inconnu'}
          hint={
            healthQuery.data?.timestamp
              ? `Ping: ${new Date(healthQuery.data.timestamp).toLocaleString('fr-FR')}`
              : 'Sans timestamp'
          }
          tone="default"
        />
      </section>

      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' ? (
        <section className="panel">
          <div className="panel-title-row">
            <h2>Top 5 actuel</h2>
            <p>Tri d'origine API: capturés desc, vus desc, UUID asc.</p>
          </div>

          {leaderboardQuery.isLoading ? (
            <p>Chargement du classement...</p>
          ) : leaderboardQuery.isError ? (
            <p className="error-banner">{leaderboardQuery.error.message}</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Joueur</th>
                    <th>Capturés</th>
                    <th>Vus</th>
                    <th>Complétion</th>
                    <th>Shiny</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.slice(0, 5).map((entry) => (
                    <tr key={entry.uuid}>
                      <td>#{entry.rank}</td>
                      <td>{entry.name}</td>
                      <td>{numberFormat.format(entry.caught)}</td>
                      <td>{numberFormat.format(entry.seen)}</td>
                      <td>{entry.completionFormatted}</td>
                      <td>{numberFormat.format(entry.shinyCaught)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'leaderboard' ? (
        <section className="panel">
          <div className="panel-title-row">
            <h2>Leaderboard dynamique</h2>
            <p>
              Change la valeur de classement pour comparer les joueurs selon
              différents indicateurs.
            </p>
          </div>

          <div className="controls-row">
            <label>
              Valeur de classement
              <select
                value={selectedMetric}
                onChange={(event) => setSelectedMetric(event.target.value)}
              >
                {leaderboardMetrics.map((metric) => (
                  <option key={metric.id} value={metric.id}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ordre
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value)}
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </label>
          </div>

          {leaderboardQuery.isLoading ? (
            <p>Chargement du leaderboard...</p>
          ) : leaderboardQuery.isError ? (
            <p className="error-banner">{leaderboardQuery.error.message}</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rang dynamique</th>
                    <th>Rang API</th>
                    <th>Joueur</th>
                    <th>Métrique active</th>
                    <th>Capturés</th>
                    <th>Vus</th>
                    <th>Complétion</th>
                    <th>Shiny capturés</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedRows.map((entry) => (
                    <tr key={entry.uuid}>
                      <td>#{entry.dynamicRank}</td>
                      <td>#{entry.rank}</td>
                      <td>{entry.name}</td>
                      <td>{formatMetric(entry, selectedMetric)}</td>
                      <td>{numberFormat.format(entry.caught)}</td>
                      <td>{numberFormat.format(entry.seen)}</td>
                      <td>{entry.completionFormatted}</td>
                      <td>{numberFormat.format(entry.shinyCaught)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'players' ? (
        <section className="panel two-columns">
          <div className="player-list">
            <h2>Joueurs</h2>
            {playersQuery.isLoading ? <p>Chargement des joueurs...</p> : null}
            {playersQuery.isError ? (
              <p className="error-banner">{playersQuery.error.message}</p>
            ) : null}

            <ul>
              {players.map((player) => (
                <li key={player.uuid}>
                  <button
                    type="button"
                    className={
                      selectedPlayerUuid === player.uuid
                        ? 'player-button is-active'
                        : 'player-button'
                    }
                    onClick={() => setSelectedPlayerUuid(player.uuid)}
                  >
                    <span>{player.name}</span>
                    <small>{player.shortUuid}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="profile-panel">
            <h2>Profil agrégé</h2>
            {profileQuery.isLoading ? <p>Chargement du profil...</p> : null}
            {profileQuery.isError ? (
              <p className="error-banner">{profileQuery.error.message}</p>
            ) : null}

            {profile ? (
              <>
                <div className="profile-header">
                  <h3>{profile.name}</h3>
                  <p>{profile.uuid}</p>
                </div>

                <div className="profile-grid">
                  <article className="mini-panel">
                    <h4>Pokédex</h4>
                    {profile.pokedex ? (
                      <ul>
                        <li>Entrées: {numberFormat.format(profile.pokedex.count)}</li>
                        <li>Vus: {numberFormat.format(profile.pokedex.seen)}</li>
                        <li>
                          Capturés: {numberFormat.format(profile.pokedex.caught)}
                        </li>
                        <li>Complétion: {profile.pokedex.completionFormatted}</li>
                        <li>
                          Shiny capturés:{' '}
                          {numberFormat.format(profile.pokedex.shinyCaught)}
                        </li>
                      </ul>
                    ) : (
                      <p>Aucun fichier Pokédex trouvé.</p>
                    )}
                  </article>

                  <article className="mini-panel">
                    <h4>Stats gameplay</h4>
                    {profile.stats ? (
                      <ul>
                        <li>
                          Temps de jeu:{' '}
                          {profile.stats.playTime?.formatted || '0h00'}
                        </li>
                        <li>
                          Morts: {numberFormat.format(profile.stats.deaths || 0)}
                        </li>
                        <li>
                          Mobs tués:{' '}
                          {numberFormat.format(profile.stats.mobKills || 0)}
                        </li>
                        <li>Sauts: {numberFormat.format(profile.stats.jumps || 0)}</li>
                        <li>
                          Dégâts infligés:{' '}
                          {numberFormat.format(profile.stats.damageDealt || 0)}
                        </li>
                        <li>
                          Distance sprint:{' '}
                          {formatDistanceKm(profile.stats.distances?.sprintKm)}
                        </li>
                      </ul>
                    ) : (
                      <p>Aucun fichier stats trouvé.</p>
                    )}
                  </article>
                </div>
              </>
            ) : (
              <p>Sélectionne un joueur pour afficher son profil.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
