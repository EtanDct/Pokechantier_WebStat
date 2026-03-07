import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pokeApi, queryKeys } from '../api/pokechantierApi';
import StatCard from '../components/StatCard';
import TabBar from '../components/TabBar';
import { countRareCapturedByPlayerFromSummaries } from '../data/rareSpecies';

const numberFormat = new Intl.NumberFormat('fr-FR');

const tabs = [
  { id: 'overview', label: 'Vue globale' },
  { id: 'captures', label: 'Stats captures' },
  { id: 'gameplay', label: 'Stats gameplay' },
  { id: 'insights', label: 'Top & Indice' },
  { id: 'players', label: 'Profils joueurs' },
];

const chantierTags = [
  '#chantier',
  '#cobblemon',
  '#collecte',
  '#evolution',
  '#infra',
];

const captureLeaderboardMetrics = [
  { id: 'caught', label: 'Pokémon capturés' },
  { id: 'seen', label: 'Pokémon vus' },
  { id: 'completion', label: 'Taux de capture (%)' },
  { id: 'shinyCaught', label: 'Shiny capturés' },
  { id: 'shinySeen', label: 'Shiny vus' },
  { id: 'count', label: 'Entrées Pokédex' },
  { id: 'legendaryCaught', label: 'Légendaires capturés' },
  { id: 'mythicalCaught', label: 'Fabuleux capturés' },
  { id: 'ultraBeastCaught', label: 'Ultra-Chimères capturées' },
];

const statsLeaderboardMetrics = [
  { id: 'playHours', label: 'Temps de jeu' },
  { id: 'mobKills', label: 'Mobs tués' },
  { id: 'deaths', label: 'Morts' },
  { id: 'jumps', label: 'Sauts' },
  { id: 'distanceTotalKm', label: 'Distance totale (km)' },
  { id: 'sprintKm', label: 'Distance sprint (km)' },
];

const BADGE_LEVELS = {
  caught: { bronze: 100, argent: 500, or: 1000 },
  shinyCaught: { bronze: 50, argent: 250, or: 500 },
  distanceTotalKm: { bronze: 250, argent: 1000, or: 2500 },
  playHours: { bronze: 50, argent: 150, or: 300 },
  mobKills: { bronze: 250, argent: 500, or: 1000 },
  jumps: { bronze: 25000, argent: 75000, or: 200000 },
  noDeathMinHours: 5,
};

function formatDistanceKm(value) {
  return `${Number(value || 0).toFixed(2)} km`;
}

function badgeTier(value, levels) {
  if (value >= levels.or) return 'Or';
  if (value >= levels.argent) return 'Argent';
  if (value >= levels.bronze) return 'Bronze';
  return null;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCaptureMetric, setSelectedCaptureMetric] = useState('caught');
  const [captureSortDirection, setCaptureSortDirection] = useState('desc');
  const [selectedStatsMetric, setSelectedStatsMetric] = useState('playHours');
  const [statsSortDirection, setStatsSortDirection] = useState('desc');
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

  const rareCaughtQuery = useQuery({
    queryKey: [
      'global-rare-caught',
      players.map((player) => player.uuid).sort().join(','),
    ],
    enabled: players.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const playerSummaries = await Promise.all(
        players.map(async (player) => {
          try {
            return {
              uuid: player.uuid,
              summary: await pokeApi.getPokedexSummary(player.uuid),
            };
          } catch {
            return {
              uuid: player.uuid,
              summary: null,
            };
          }
        }),
      );

      return countRareCapturedByPlayerFromSummaries(playerSummaries);
    },
  });

  const allProfilesQuery = useQuery({
    queryKey: [
      'all-player-profiles',
      players.map((player) => player.uuid).sort().join(','),
    ],
    enabled: players.length > 0,
    staleTime: 60_000,
    queryFn: async () =>
      Promise.all(
        players.map(async (player) => {
          try {
            const profile = await pokeApi.getPlayerProfile(player.uuid);
            return {
              ...profile,
              uuid: profile?.uuid || player.uuid,
              name: profile?.name || player.name || 'Joueur inconnu',
            };
          } catch {
            return {
              ok: false,
              uuid: player.uuid,
              name: player.name || 'Joueur inconnu',
              pokedex: null,
              stats: null,
            };
          }
        }),
      ),
  });

  const rareCaught = rareCaughtQuery.data;
  const rareCaughtByPlayer = rareCaught?.byPlayer || {};

  const captureRankedRows = useMemo(() => {
    const entries = ranking.map((entry) => ({
      ...entry,
      legendaryCaught: Number(rareCaughtByPlayer[entry.uuid]?.legendaryCaught || 0),
      mythicalCaught: Number(rareCaughtByPlayer[entry.uuid]?.mythicalCaught || 0),
      ultraBeastCaught: Number(rareCaughtByPlayer[entry.uuid]?.ultraBeastCaught || 0),
    }));

    entries.sort((a, b) => {
      const valueA = Number(a[selectedCaptureMetric] || 0);
      const valueB = Number(b[selectedCaptureMetric] || 0);

      if (valueA !== valueB) {
        return captureSortDirection === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      }

      if (b.caught !== a.caught) return b.caught - a.caught;
      if (b.seen !== a.seen) return b.seen - a.seen;
      return a.uuid.localeCompare(b.uuid);
    });

    return entries.map((entry, index) => ({
      ...entry,
      dynamicRank: index + 1,
    }));
  }, [ranking, selectedCaptureMetric, captureSortDirection, rareCaughtByPlayer]);

  const statsRankedRows = useMemo(() => {
    const profiles = allProfilesQuery.data || [];
    const entries = profiles.map((profile) => {
      const stats = profile?.stats || {};
      const distances = stats.distances || {};
      const walkKm = Number(distances.walkKm || 0);
      const sprintKm = Number(distances.sprintKm || 0);
      const swimKm = Number(distances.swimKm || 0);
      const flyKm = Number(distances.flyKm || 0);
      const fallKm = Number(distances.fallKm || 0);
      const climbKm = Number(distances.climbKm || 0);
      const distanceTotalKm =
        walkKm + sprintKm + swimKm + flyKm + fallKm + climbKm;
      const playHours =
        Number(stats.playTime?.hours || 0) +
        Number(stats.playTime?.minutes || 0) / 60;

      return {
        uuid: profile.uuid,
        name: profile.name || 'Joueur inconnu',
        playTimeFormatted: stats.playTime?.formatted || '0h00',
        playHours,
        deaths: Number(stats.deaths || 0),
        mobKills: Number(stats.mobKills || 0),
        jumps: Number(stats.jumps || 0),
        walkKm,
        sprintKm,
        swimKm,
        flyKm,
        distanceTotalKm,
      };
    });

    entries.sort((a, b) => {
      const valueA = Number(a[selectedStatsMetric] || 0);
      const valueB = Number(b[selectedStatsMetric] || 0);

      if (valueA !== valueB) {
        return statsSortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      if (b.mobKills !== a.mobKills) return b.mobKills - a.mobKills;
      if (b.jumps !== a.jumps) return b.jumps - a.jumps;
      return a.uuid.localeCompare(b.uuid);
    });

    return entries.map((entry, index) => ({
      ...entry,
      dynamicRank: index + 1,
    }));
  }, [allProfilesQuery.data, selectedStatsMetric, statsSortDirection]);

  const bestCompletionPlayer = ranking.reduce((best, entry) => {
    if (!best) return entry;
    const entryCompletion = Number(entry.completion || 0);
    const bestCompletion = Number(best.completion || 0);
    if (entryCompletion > bestCompletion) return entry;
    if (entryCompletion === bestCompletion && entry.caught > best.caught) return entry;
    return best;
  }, null);
  const bestCaughtPlayer = ranking.reduce((best, entry) => {
    if (!best) return entry;
    if (entry.caught > best.caught) return entry;
    if (entry.caught === best.caught && entry.seen > best.seen) return entry;
    return best;
  }, null);
  const totalCaught = ranking.reduce(
    (total, entry) => total + Number(entry.caught || 0),
    0,
  );
  const playerInsightsRows = useMemo(() => {
    const rankingByUuid = new Map(ranking.map((entry) => [entry.uuid, entry]));
    const statsByUuid = new Map(statsRankedRows.map((entry) => [entry.uuid, entry]));
    const profilesByUuid = new Map(
      (allProfilesQuery.data || []).map((profile) => [profile.uuid, profile]),
    );

    return players.map((player) => {
      const rankingEntry = rankingByUuid.get(player.uuid);
      const statsEntry = statsByUuid.get(player.uuid);
      const profile = profilesByUuid.get(player.uuid);
      const rareEntry = rareCaughtByPlayer[player.uuid] || {};

      const caught = Number(rankingEntry?.caught || 0);
      const seen = Number(rankingEntry?.seen || 0);
      const completion = Number(rankingEntry?.completion || 0);
      const shinyCaught = Number(rankingEntry?.shinyCaught || 0);
      const legendaryCaught = Number(rareEntry.legendaryCaught || 0);
      const mythicalCaught = Number(rareEntry.mythicalCaught || 0);
      const ultraBeastCaught = Number(rareEntry.ultraBeastCaught || 0);
      const rareTotal = legendaryCaught + mythicalCaught + ultraBeastCaught;
      const playHours = Number(statsEntry?.playHours || 0);
      const distanceTotalKm = Number(statsEntry?.distanceTotalKm || 0);
      const mobKills = Number(statsEntry?.mobKills || 0);
      const jumps = Number(statsEntry?.jumps || 0);
      const deaths = Number(statsEntry?.deaths || 0);

      return {
        uuid: player.uuid,
        name:
          rankingEntry?.name || statsEntry?.name || profile?.name || player.name || 'Joueur inconnu',
        caught,
        seen,
        completion,
        shinyCaught,
        legendaryCaught,
        mythicalCaught,
        ultraBeastCaught,
        rareTotal,
        playHours,
        distanceTotalKm,
        mobKills,
        jumps,
        deaths,
        hasPokedex: Boolean(profile?.pokedex || rankingEntry),
        hasStats: Boolean(profile?.stats),
        hasRare: Boolean(rareCaughtByPlayer[player.uuid]),
      };
    });
  }, [players, ranking, statsRankedRows, allProfilesQuery.data, rareCaughtByPlayer]);
  const insightMaxima = useMemo(
    () =>
      playerInsightsRows.reduce(
        (max, row) => ({
          caught: Math.max(max.caught, row.caught),
          completion: Math.max(max.completion, row.completion),
          shinyCaught: Math.max(max.shinyCaught, row.shinyCaught),
          rareTotal: Math.max(max.rareTotal, row.rareTotal),
          playHours: Math.max(max.playHours, row.playHours),
          distanceTotalKm: Math.max(max.distanceTotalKm, row.distanceTotalKm),
          mobKills: Math.max(max.mobKills, row.mobKills),
          jumps: Math.max(max.jumps, row.jumps),
        }),
        {
          caught: 0,
          completion: 0,
          shinyCaught: 0,
          rareTotal: 0,
          playHours: 0,
          distanceTotalKm: 0,
          mobKills: 0,
          jumps: 0,
        },
      ),
    [playerInsightsRows],
  );
  const indexedPlayers = useMemo(() => {
    const safeRatio = (value, max) => (max > 0 ? value / max : 0);

    return [...playerInsightsRows]
      .map((row) => {
        const globalIndex =
          safeRatio(row.caught, insightMaxima.caught) * 0.28 +
          safeRatio(row.completion, insightMaxima.completion) * 0.2 +
          safeRatio(row.shinyCaught, insightMaxima.shinyCaught) * 0.12 +
          safeRatio(row.rareTotal, insightMaxima.rareTotal) * 0.15 +
          safeRatio(row.playHours, insightMaxima.playHours) * 0.1 +
          safeRatio(row.distanceTotalKm, insightMaxima.distanceTotalKm) * 0.08 +
          safeRatio(row.mobKills, insightMaxima.mobKills) * 0.07;

        return {
          ...row,
          globalIndex: Math.round(globalIndex * 1000) / 10,
        };
      })
      .sort((a, b) => {
        if (b.globalIndex !== a.globalIndex) return b.globalIndex - a.globalIndex;
        if (b.caught !== a.caught) return b.caught - a.caught;
        return a.name.localeCompare(b.name);
      })
      .map((row, index) => ({
        ...row,
        indexRank: index + 1,
      }));
  }, [playerInsightsRows, insightMaxima]);
  const topServer = useMemo(() => {
    const byMetric = (metric) => {
      if (playerInsightsRows.length === 0) return null;

      return [...playerInsightsRows].sort((a, b) => {
        if (b[metric] !== a[metric]) return b[metric] - a[metric];
        return a.name.localeCompare(b.name);
      })[0];
    };

    return {
      topCaught: byMetric('caught'),
      topCompletion: byMetric('completion'),
      topShiny: byMetric('shinyCaught'),
      topDistance: byMetric('distanceTotalKm'),
      topPlaytime: byMetric('playHours'),
    };
  }, [playerInsightsRows]);
  const insightsLoading =
    playersQuery.isLoading ||
    leaderboardQuery.isLoading ||
    allProfilesQuery.isLoading ||
    rareCaughtQuery.isLoading;
  const insightsError =
    playersQuery.error ||
    leaderboardQuery.error ||
    allProfilesQuery.error ||
    rareCaughtQuery.error;

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
      await Promise.all([
        playersQuery.refetch(),
        leaderboardQuery.refetch(),
        rareCaughtQuery.refetch(),
        allProfilesQuery.refetch(),
      ]);
    } catch (error) {
      setRefreshError(error.message || 'Impossible de rafraîchir les données.');
    } finally {
      setIsServerRefreshing(false);
    }
  }

  const profile = profileQuery.data;
  const selectedProfileInsights = useMemo(
    () => playerInsightsRows.find((row) => row.uuid === selectedPlayerUuid) || null,
    [playerInsightsRows, selectedPlayerUuid],
  );
  const selectedProfileBadges = useMemo(() => {
    if (!selectedProfileInsights) return [];

    const row = selectedProfileInsights;
    const badges = [];

    const captureTier = badgeTier(row.caught, BADGE_LEVELS.caught);
    const shinyTier = badgeTier(row.shinyCaught, BADGE_LEVELS.shinyCaught);
    const distanceTier = badgeTier(row.distanceTotalKm, BADGE_LEVELS.distanceTotalKm);
    const playHoursTier = badgeTier(row.playHours, BADGE_LEVELS.playHours);
    const mobKillsTier = badgeTier(row.mobKills, BADGE_LEVELS.mobKills);
    const jumpsTier = badgeTier(row.jumps, BADGE_LEVELS.jumps);

    if (captureTier) badges.push(`Maître captures (${captureTier})`);
    if (shinyTier) badges.push(`Chasseur shiny (${shinyTier})`);
    if (distanceTier) badges.push(`Explorateur (${distanceTier})`);
    if (playHoursTier) badges.push(`Vétéran (${playHoursTier})`);
    if (mobKillsTier) badges.push(`Combattant (${mobKillsTier})`);
    if (jumpsTier) badges.push(`Acrobate (${jumpsTier})`);
    if (row.deaths === 0 && row.playHours >= BADGE_LEVELS.noDeathMinHours) {
      badges.push('Trophée: Sans mort');
    }

    return badges;
  }, [selectedProfileInsights]);

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
          <div className="tag-row">
            {chantierTags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={refreshServerCache}
          disabled={isServerRefreshing}
        >
          {isServerRefreshing
            ? 'Rafraîchissement en cours...'
            : 'Refresh les données serveur'}
        </button>
      </header>

      {refreshError ? <p className="error-banner">{refreshError}</p> : null}

      <section className="stats-grid">
        <StatCard
          label="Joueurs connus"
          value={numberFormat.format(players.length)}
          tone="teal"
        />
        <StatCard
          label="Capturés (global)"
          value={numberFormat.format(totalCaught)}
          tone="orange"
        />
        <StatCard
          label="Meilleur taux de capture"
          value={
            bestCompletionPlayer
              ? `${Number(bestCompletionPlayer.completion || 0).toFixed(2)}%`
              : '--'
          }
          hint={bestCompletionPlayer ? bestCompletionPlayer.name : 'Aucune donnée'}
          tone="olive"
        />
        <StatCard
          label="Meilleur capturés"
          value={
            bestCaughtPlayer ? numberFormat.format(bestCaughtPlayer.caught || 0) : '--'
          }
          hint={bestCaughtPlayer ? bestCaughtPlayer.name : 'Aucune donnée'}
          tone="teal"
        />
        <StatCard
          label="Légendaires capturés"
          value={
            rareCaughtQuery.isLoading
              ? '...'
              : numberFormat.format(rareCaught?.legendaryUniqueCount || 0)
          }
          hint={
            rareCaughtQuery.isError
              ? 'Lecture impossible'
              : `${numberFormat.format(rareCaught?.legendaryCaught || 0)} captures totales`
          }
          tone="teal"
        />
        <StatCard
          label="Fabuleux capturés"
          value={
            rareCaughtQuery.isLoading
              ? '...'
              : numberFormat.format(rareCaught?.mythicalUniqueCount || 0)
          }
          hint={
            rareCaughtQuery.isError
              ? 'Lecture impossible'
              : `${numberFormat.format(rareCaught?.mythicalCaught || 0)} captures totales`
          }
          tone="orange"
        />
        <StatCard
          label="Ultra-Chimères capturées"
          value={
            rareCaughtQuery.isLoading
              ? '...'
              : numberFormat.format(rareCaught?.ultraBeastUniqueCount || 0)
          }
          hint={
            rareCaughtQuery.isError
              ? 'Lecture impossible'
              : `${numberFormat.format(rareCaught?.ultraBeastCaught || 0)} captures totales`
          }
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
          tone="teal"
        />
      </section>

      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' ? (
        <section className="panel">
          <div className="panel-title-row">
            <h2>Top 5 actuel</h2>
            <p>Tri d'origine API: capturés desc puis vus desc.</p>
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
                    <th>Taux de capture</th>
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

      {activeTab === 'captures' ? (
        <section className="panel">
          <div className="panel-title-row">
            <h2>Leaderboard captures</h2>
            <p>Pokédex + shiny + légendaires/fabuleux/ultra-chimères par joueur.</p>
          </div>

          <div className="controls-row">
            <label>
              Valeur de classement
              <select
                value={selectedCaptureMetric}
                onChange={(event) => setSelectedCaptureMetric(event.target.value)}
              >
                {captureLeaderboardMetrics.map((metric) => (
                  <option key={metric.id} value={metric.id}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ordre
              <select
                value={captureSortDirection}
                onChange={(event) => setCaptureSortDirection(event.target.value)}
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </label>
          </div>

          {leaderboardQuery.isLoading || rareCaughtQuery.isLoading ? (
            <p>Chargement du leaderboard captures...</p>
          ) : leaderboardQuery.isError ? (
            <p className="error-banner">{leaderboardQuery.error.message}</p>
          ) : (
            <>
              {rareCaughtQuery.isError ? (
                <p className="error-banner">
                  Compteurs rares indisponibles sur ce refresh.
                </p>
              ) : null}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rang dynamique</th>
                      <th>Rang API</th>
                      <th>Joueur</th>
                      <th>Entrées</th>
                      <th>Vus</th>
                      <th>Capturés</th>
                      <th>Taux de capture</th>
                      <th>Shiny capturés</th>
                      <th>Shiny vus</th>
                      <th>Légendaires</th>
                      <th>Fabuleux</th>
                      <th>Ultra-Chimères</th>
                    </tr>
                  </thead>
                  <tbody>
                    {captureRankedRows.map((entry) => (
                      <tr key={entry.uuid}>
                        <td>#{entry.dynamicRank}</td>
                        <td>#{entry.rank}</td>
                        <td>{entry.name}</td>
                        <td>{numberFormat.format(entry.count)}</td>
                        <td>{numberFormat.format(entry.seen)}</td>
                        <td>{numberFormat.format(entry.caught)}</td>
                        <td>{entry.completionFormatted}</td>
                        <td>{numberFormat.format(entry.shinyCaught)}</td>
                        <td>{numberFormat.format(entry.shinySeen)}</td>
                        <td>{numberFormat.format(entry.legendaryCaught)}</td>
                        <td>{numberFormat.format(entry.mythicalCaught)}</td>
                        <td>{numberFormat.format(entry.ultraBeastCaught)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeTab === 'gameplay' ? (
        <section className="panel">
          <div className="panel-title-row">
            <h2>Leaderboard stats gameplay</h2>
            <p>Temps de jeu, sauts, distances et combats.</p>
          </div>

          <div className="controls-row">
            <label>
              Valeur de classement
              <select
                value={selectedStatsMetric}
                onChange={(event) => setSelectedStatsMetric(event.target.value)}
              >
                {statsLeaderboardMetrics.map((metric) => (
                  <option key={metric.id} value={metric.id}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ordre
              <select
                value={statsSortDirection}
                onChange={(event) => setStatsSortDirection(event.target.value)}
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </label>
          </div>

          {allProfilesQuery.isLoading ? (
            <p>Chargement du leaderboard stats...</p>
          ) : allProfilesQuery.isError ? (
            <p className="error-banner">{allProfilesQuery.error.message}</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rang dynamique</th>
                    <th>Joueur</th>
                    <th>Temps de jeu</th>
                    <th>Morts</th>
                    <th>Mobs tués</th>
                    <th>Sauts</th>
                    <th>Distance totale</th>
                    <th>Sprint</th>
                    <th>Marche</th>
                    <th>Natation</th>
                    <th>Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {statsRankedRows.map((entry) => (
                    <tr key={entry.uuid}>
                      <td>#{entry.dynamicRank}</td>
                      <td>{entry.name}</td>
                      <td>{entry.playTimeFormatted}</td>
                      <td>{numberFormat.format(entry.deaths)}</td>
                      <td>{numberFormat.format(entry.mobKills)}</td>
                      <td>{numberFormat.format(entry.jumps)}</td>
                      <td>{formatDistanceKm(entry.distanceTotalKm)}</td>
                      <td>{formatDistanceKm(entry.sprintKm)}</td>
                      <td>{formatDistanceKm(entry.walkKm)}</td>
                      <td>{formatDistanceKm(entry.swimKm)}</td>
                      <td>{formatDistanceKm(entry.flyKm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'insights' ? (
        <section className="panel">
          <div className="panel-title-row">
            <h2>Top & Indice</h2>
            <p>
              Vue analytique: top serveur et indice global.
            </p>
          </div>

          {insightsLoading ? (
            <p>Chargement des insights...</p>
          ) : insightsError ? (
            <p className="error-banner">{insightsError.message}</p>
          ) : (
            <>
              <article className="mini-panel">
                <div className="panel-title-row">
                  <h3>Top serveur</h3>
                  <p>Les meilleurs scores en captures, progression et activite.</p>
                </div>
                <div className="stats-grid">
                  <StatCard
                    label="Top captures"
                    value={numberFormat.format(topServer.topCaught?.caught || 0)}
                    hint={topServer.topCaught?.name || 'Aucune donnee'}
                    tone="orange"
                  />
                  <StatCard
                    label="Top taux capture"
                    value={`${Number(topServer.topCompletion?.completion || 0).toFixed(2)}%`}
                    hint={topServer.topCompletion?.name || 'Aucune donnee'}
                    tone="olive"
                  />
                  <StatCard
                    label="Top shiny"
                    value={numberFormat.format(topServer.topShiny?.shinyCaught || 0)}
                    hint={topServer.topShiny?.name || 'Aucune donnee'}
                    tone="teal"
                  />
                  <StatCard
                    label="Top distance"
                    value={formatDistanceKm(topServer.topDistance?.distanceTotalKm || 0)}
                    hint={topServer.topDistance?.name || 'Aucune donnee'}
                    tone="teal"
                  />
                  <StatCard
                    label="Top temps de jeu"
                    value={`${Number(topServer.topPlaytime?.playHours || 0).toFixed(1)} h`}
                    hint={topServer.topPlaytime?.name || 'Aucune donnee'}
                    tone="orange"
                  />
                </div>
              </article>

              <article className="mini-panel">
                <div className="panel-title-row">
                  <h3>Indice global joueur</h3>
                  <p>Score composite (0-100) pour comparer la performance globale.</p>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Rang</th>
                        <th>Joueur</th>
                        <th>Indice global</th>
                        <th>Captures</th>
                        <th>Taux capture</th>
                        <th>Rares</th>
                        <th>Distance</th>
                        <th>Temps de jeu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indexedPlayers.map((row) => (
                        <tr key={row.uuid}>
                          <td>#{row.indexRank}</td>
                          <td>{row.name}</td>
                          <td>{row.globalIndex.toFixed(1)} / 100</td>
                          <td>{numberFormat.format(row.caught)}</td>
                          <td>{row.completion.toFixed(2)}%</td>
                          <td>{numberFormat.format(row.rareTotal)}</td>
                          <td>{formatDistanceKm(row.distanceTotalKm)}</td>
                          <td>{row.playHours.toFixed(1)} h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

            </>
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
                        <li>
                          Taux de capture: {profile.pokedex.completionFormatted}
                        </li>
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
                          Distance sprint:{' '}
                          {formatDistanceKm(profile.stats.distances?.sprintKm)}
                        </li>
                      </ul>
                    ) : (
                      <p>Aucun fichier stats trouvé.</p>
                    )}
                  </article>

                  <article className="mini-panel">
                    <h4>Badges </h4>
                    {selectedProfileInsights ? (
                      <>
                        {selectedProfileBadges.length > 0 ? (
                          <ul>
                            {selectedProfileBadges.map((badge) => (
                              <li key={badge}>{badge}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>Aucun badge attribué pour le moment.</p>
                        )}
                        <div className="stat-card-hint">
                          <p>Seuils badges:</p>
                          <ul>
                            <li>
                              Capturés: bronze {numberFormat.format(BADGE_LEVELS.caught.bronze)},
                              argent {numberFormat.format(BADGE_LEVELS.caught.argent)}, or{' '}
                              {numberFormat.format(BADGE_LEVELS.caught.or)}.
                            </li>
                            <li>
                              Shiny: bronze {numberFormat.format(BADGE_LEVELS.shinyCaught.bronze)},
                              argent {numberFormat.format(BADGE_LEVELS.shinyCaught.argent)}, or{' '}
                              {numberFormat.format(BADGE_LEVELS.shinyCaught.or)}.
                            </li>
                            <li>
                              Distance: bronze{' '}
                              {numberFormat.format(BADGE_LEVELS.distanceTotalKm.bronze)} km,
                              argent {numberFormat.format(BADGE_LEVELS.distanceTotalKm.argent)} km,
                              or {numberFormat.format(BADGE_LEVELS.distanceTotalKm.or)} km.
                            </li>
                            <li>
                              Temps de jeu: bronze{' '}
                              {numberFormat.format(BADGE_LEVELS.playHours.bronze)} h, argent{' '}
                              {numberFormat.format(BADGE_LEVELS.playHours.argent)} h, or{' '}
                              {numberFormat.format(BADGE_LEVELS.playHours.or)} h.
                            </li>
                            <li>
                              Mobs tués: bronze {numberFormat.format(BADGE_LEVELS.mobKills.bronze)},
                              argent {numberFormat.format(BADGE_LEVELS.mobKills.argent)}, or{' '}
                              {numberFormat.format(BADGE_LEVELS.mobKills.or)}.
                            </li>
                            <li>
                              Sauts: bronze {numberFormat.format(BADGE_LEVELS.jumps.bronze)},
                              argent {numberFormat.format(BADGE_LEVELS.jumps.argent)}, or{' '}
                              {numberFormat.format(BADGE_LEVELS.jumps.or)}.
                            </li>
                            <li>Rare total: à étudier.</li>
                            <li>
                              Trophée unique Sans mort: 0 mort et au moins{' '}
                              {numberFormat.format(BADGE_LEVELS.noDeathMinHours)} h.
                            </li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p>Données insuffisantes pour calculer les badges.</p>
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
