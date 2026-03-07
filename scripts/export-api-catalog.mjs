import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');

const API_BASE_URL = (process.env.API_BASE_URL || 'https://pokeapi.chantierland.com').replace(/\/+$/, '');
const OUTPUT_PATH = path.resolve(
  projectRoot,
  process.env.API_CATALOG_OUTPUT || 'docs/api-data-catalog.json',
);
const REQUEST_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS || 10000);

const BASE_ENDPOINTS = [
  { label: 'GET /api/health', path: '/api/health' },
  { label: 'GET /api/players', path: '/api/players' },
  { label: 'GET /api/leaderboard', path: '/api/leaderboard' },
  { label: 'GET /api/pokedex', path: '/api/pokedex' },
  { label: 'GET /api/pokedex/files', path: '/api/pokedex/files' },
  { label: 'GET /api/pokedex/tree', path: '/api/pokedex/tree' },
  { label: 'GET /api/stats/files', path: '/api/stats/files' },
  { label: 'GET /api/storage/files', path: '/api/storage/files' },
  { label: 'GET /api/debug/world', path: '/api/debug/world' },
  { label: 'GET /api/debug/identity', path: '/api/debug/identity' },
];

const PLAYER_ENDPOINTS = [
  {
    label: 'GET /api/players/:uuid/profile',
    buildPath: (uuid) => `/api/players/${uuid}/profile`,
  },
  {
    label: 'GET /api/stats/:uuid',
    buildPath: (uuid) => `/api/stats/${uuid}`,
  },
  {
    label: 'GET /api/stats/raw/:uuid',
    buildPath: (uuid) => `/api/stats/raw/${uuid}`,
    sampleOnly: true,
  },
  {
    label: 'GET /api/pokedex/:uuid/summary',
    buildPath: (uuid) => `/api/pokedex/${uuid}/summary`,
  },
  {
    label: 'GET /api/pokedex/:uuid',
    buildPath: (uuid) => `/api/pokedex/${uuid}`,
    sampleOnly: true,
  },
];

const DOCUMENTED_FIELDS = {
  'GET /api/health': ['status', 'timestamp'],
  'GET /api/players': [
    'count',
    'players[].uuid',
    'players[].shortUuid',
    'players[].name',
    'players[].hasStats',
    'players[].hasPokedex',
    'error',
    'cached',
  ],
  'GET /api/players/:uuid/profile': [
    'ok',
    'uuid',
    'shortUuid',
    'name',
    'pokedex.count',
    'pokedex.seen',
    'pokedex.caught',
    'pokedex.completion',
    'pokedex.completionFormatted',
    'pokedex.shinyCaught',
    'pokedex.shinySeen',
    'stats.playTime.ticks',
    'stats.playTime.hours',
    'stats.playTime.minutes',
    'stats.playTime.formatted',
    'stats.deaths',
    'stats.mobKills',
    'stats.damageDealt',
    'stats.damageTaken',
    'stats.jumps',
    'stats.leaveGame',
    'stats.distances.walkKm',
    'stats.distances.sprintKm',
    'stats.distances.swimKm',
    'stats.distances.flyKm',
    'stats.distances.fallKm',
    'stats.distances.climbKm',
    'stats.cobblemon.caught',
    'stats.cobblemon.registered',
    'stats.cobblemon.shinyCaught',
    'error',
  ],
  'GET /api/leaderboard': [
    'count',
    'ranking[].rank',
    'ranking[].uuid',
    'ranking[].shortUuid',
    'ranking[].name',
    'ranking[].count',
    'ranking[].seen',
    'ranking[].caught',
    'ranking[].completion',
    'ranking[].completionFormatted',
    'ranking[].shinyCaught',
    'ranking[].shinySeen',
    'cached',
  ],
  'GET /api/pokedex': ['found', 'path', 'entries[]', 'error'],
  'GET /api/pokedex/files': ['exists', 'path', 'count', 'entries[]', 'error'],
  'GET /api/pokedex/tree': [
    'exists',
    'path',
    'subdir_count',
    'total_files',
    'tree[].prefix',
    'tree[].files[]',
    'tree[].count',
    'tree[].note',
    'error',
  ],
  'GET /api/pokedex/:uuid/summary': [
    'ok',
    'uuid',
    'count',
    'seen',
    'caught',
    'pokemon[].species',
    'pokemon[].knowledge',
    'pokemon[].shiny',
    'pokemon[].gender',
    'pokemon[].form',
    'error',
  ],
  'GET /api/pokedex/:uuid': ['ok', 'uuid', 'path', 'raw', 'error'],
  'GET /api/stats/files': ['exists', 'path', 'count', 'entries[]', 'error'],
  'GET /api/stats/:uuid': [
    'ok',
    'uuid',
    'name',
    'playTime.ticks',
    'playTime.hours',
    'playTime.minutes',
    'playTime.formatted',
    'deaths',
    'mobKills',
    'damageDealt',
    'damageTaken',
    'jumps',
    'leaveGame',
    'distances.walkKm',
    'distances.sprintKm',
    'distances.swimKm',
    'distances.flyKm',
    'distances.fallKm',
    'distances.climbKm',
    'cobblemon.caught',
    'cobblemon.registered',
    'cobblemon.shinyCaught',
    'error',
  ],
  'GET /api/stats/raw/:uuid': ['stats'],
  'GET /api/storage/files': ['exists', 'path', 'count', 'entries[]', 'error'],
  'GET /api/debug/world': ['exists', 'path', 'entries[]', 'error'],
  'GET /api/debug/identity': [
    'usercache[].path',
    'usercache[].accessible',
    'usercache[].entries',
    'usercache[].sample.name',
    'usercache[].sample.uuid',
    'usercache[].reason',
    'ftbEssentials.accessible',
    'ftbEssentials.snbtFiles',
    'ftbEssentials.files[]',
    'ftbEssentials.reason',
  ],
};

function unique(list) {
  return Array.from(new Set(list));
}

function collectFieldPaths(value) {
  const fields = new Set();

  function walk(node, prefix) {
    if (Array.isArray(node)) {
      const arrayPath = prefix ? `${prefix}[]` : '[]';

      if (node.length === 0) {
        fields.add(arrayPath);
        return;
      }

      for (const item of node) {
        walk(item, arrayPath);
      }

      return;
    }

    if (node && typeof node === 'object') {
      const entries = Object.entries(node);

      if (entries.length === 0 && prefix) {
        fields.add(prefix);
        return;
      }

      for (const [key, child] of entries) {
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        walk(child, nextPrefix);
      }

      return;
    }

    if (prefix) fields.add(prefix);
  }

  walk(value, '');
  return Array.from(fields).sort();
}

function mergeFieldSets(existing = [], next = []) {
  return unique([...existing, ...next]).sort();
}

function trimPayload(value, depth = 0) {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= 3) return '[truncated]';

  if (Array.isArray(value)) {
    const slice = value.slice(0, 3).map((item) => trimPayload(item, depth + 1));
    if (value.length > 3) {
      slice.push(`[+${value.length - 3} items]`);
    }
    return slice;
  }

  const entries = Object.entries(value);
  const limited = entries.slice(0, 20);
  const output = {};

  for (const [key, entryValue] of limited) {
    output[key] = trimPayload(entryValue, depth + 1);
  }

  if (entries.length > 20) {
    output.__truncatedKeys = entries.length - 20;
  }

  return output;
}

async function requestJson(pathname) {
  const url = `${API_BASE_URL}${pathname}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - startedAt;
    const rawText = await response.text();

    let json = null;
    try {
      json = JSON.parse(rawText);
    } catch {
      json = null;
    }

    return {
      url,
      status: response.status,
      ok: response.ok,
      elapsedMs,
      json,
      text: json ? null : rawText.slice(0, 500),
      isJson: Boolean(json),
    };
  } catch (error) {
    return {
      url,
      status: null,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      json: null,
      text: null,
      isJson: false,
      requestError: error.name === 'AbortError' ? 'timeout' : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeProbe(label, pathOrTemplate, requestResult, uuid = null) {
  const discoveredFields = requestResult.json ? collectFieldPaths(requestResult.json) : [];

  return {
    label,
    path: pathOrTemplate,
    uuid,
    status: requestResult.status,
    ok: requestResult.ok,
    elapsedMs: requestResult.elapsedMs,
    url: requestResult.url,
    isJson: requestResult.isJson,
    requestError: requestResult.requestError || null,
    textPreview: requestResult.text,
    discoveredFields,
    sample: requestResult.json ? trimPayload(requestResult.json) : null,
  };
}

function findPlayerUuids(baseProbes) {
  const playersProbe = baseProbes.find((probe) => probe.label === 'GET /api/players');
  const leaderboardProbe = baseProbes.find((probe) => probe.label === 'GET /api/leaderboard');

  const fromPlayers = playersProbe?.sample?.players
    ? playersProbe.sample.players
        .map((entry) => entry?.uuid)
        .filter(Boolean)
    : [];

  const fromLeaderboard = leaderboardProbe?.sample?.ranking
    ? leaderboardProbe.sample.ranking
        .map((entry) => entry?.uuid)
        .filter(Boolean)
    : [];

  return unique([...fromPlayers, ...fromLeaderboard]);
}

function toDynamicSummary(dynamicProbes) {
  const output = {};

  for (const [label, probes] of Object.entries(dynamicProbes)) {
    output[label] = probes.map((probe) => ({
      uuid: probe.uuid,
      status: probe.status,
      ok: probe.ok,
      elapsedMs: probe.elapsedMs,
      requestError: probe.requestError,
      discoveredFields: probe.discoveredFields,
      sample: probe.sample,
      textPreview: probe.textPreview,
    }));
  }

  return output;
}

function buildDisplaySuggestions() {
  return [
    {
      id: 'overview_cards',
      title: 'Cards dashboard',
      fields: [
        'GET /api/players -> count',
        'GET /api/leaderboard -> count',
        'GET /api/leaderboard -> ranking[].completion',
        'GET /api/health -> status',
        'GET /api/health -> timestamp',
      ],
    },
    {
      id: 'leaderboard_table',
      title: 'Tableau leaderboard',
      fields: [
        'GET /api/leaderboard -> ranking[].rank',
        'GET /api/leaderboard -> ranking[].name',
        'GET /api/leaderboard -> ranking[].caught',
        'GET /api/leaderboard -> ranking[].seen',
        'GET /api/leaderboard -> ranking[].completionFormatted',
        'GET /api/leaderboard -> ranking[].shinyCaught',
        'GET /api/leaderboard -> ranking[].shinySeen',
      ],
    },
    {
      id: 'player_profile',
      title: 'Profil joueur detaille',
      fields: [
        'GET /api/players/:uuid/profile -> name',
        'GET /api/players/:uuid/profile -> pokedex.count',
        'GET /api/players/:uuid/profile -> pokedex.caught',
        'GET /api/players/:uuid/profile -> pokedex.completionFormatted',
        'GET /api/players/:uuid/profile -> stats.playTime.formatted',
        'GET /api/players/:uuid/profile -> stats.deaths',
        'GET /api/players/:uuid/profile -> stats.mobKills',
        'GET /api/players/:uuid/profile -> stats.distances.sprintKm',
        'GET /api/players/:uuid/profile -> stats.cobblemon.shinyCaught',
      ],
    },
    {
      id: 'ops_debug',
      title: 'Monitoring serveur',
      fields: [
        'GET /api/debug/world -> exists',
        'GET /api/debug/world -> entries[]',
        'GET /api/debug/identity -> usercache[].accessible',
        'GET /api/debug/identity -> ftbEssentials.accessible',
        'GET /api/storage/files -> count',
      ],
    },
  ];
}

async function main() {
  const baseProbes = [];
  const discoveredFields = {};

  for (const endpoint of BASE_ENDPOINTS) {
    const response = await requestJson(endpoint.path);
    const probe = normalizeProbe(endpoint.label, endpoint.path, response);
    baseProbes.push(probe);
    discoveredFields[endpoint.label] = mergeFieldSets(
      discoveredFields[endpoint.label],
      probe.discoveredFields,
    );
  }

  const uuids = findPlayerUuids(baseProbes);
  const sampledUuid = uuids[0] || null;

  const dynamicProbes = Object.fromEntries(PLAYER_ENDPOINTS.map((endpoint) => [endpoint.label, []]));

  for (const endpoint of PLAYER_ENDPOINTS) {
    if (endpoint.sampleOnly) {
      if (!sampledUuid) continue;
      const response = await requestJson(endpoint.buildPath(sampledUuid));
      const probe = normalizeProbe(
        endpoint.label,
        endpoint.buildPath(':uuid'),
        response,
        sampledUuid,
      );
      dynamicProbes[endpoint.label].push(probe);
      discoveredFields[endpoint.label] = mergeFieldSets(
        discoveredFields[endpoint.label],
        probe.discoveredFields,
      );
      continue;
    }

    for (const uuid of uuids) {
      const response = await requestJson(endpoint.buildPath(uuid));
      const probe = normalizeProbe(
        endpoint.label,
        endpoint.buildPath(':uuid'),
        response,
        uuid,
      );
      dynamicProbes[endpoint.label].push(probe);
      discoveredFields[endpoint.label] = mergeFieldSets(
        discoveredFields[endpoint.label],
        probe.discoveredFields,
      );
    }
  }

  for (const [label, fields] of Object.entries(DOCUMENTED_FIELDS)) {
    discoveredFields[label] = mergeFieldSets(discoveredFields[label], fields);
  }

  const totalRequests =
    baseProbes.length + Object.values(dynamicProbes).reduce((sum, probes) => sum + probes.length, 0);
  const successfulRequests =
    baseProbes.filter((probe) => probe.ok).length +
    Object.values(dynamicProbes)
      .flat()
      .filter((probe) => probe.ok).length;

  const payload = {
    generatedAt: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    requestStats: {
      total: totalRequests,
      successful: successfulRequests,
      failed: totalRequests - successfulRequests,
    },
    playerSampling: {
      discoveredUuids: uuids,
      sampledUuidForRawEndpoints: sampledUuid,
    },
    baseEndpointProbes: baseProbes.map((probe) => ({
      label: probe.label,
      path: probe.path,
      status: probe.status,
      ok: probe.ok,
      elapsedMs: probe.elapsedMs,
      requestError: probe.requestError,
      discoveredFields: probe.discoveredFields,
      sample: probe.sample,
      textPreview: probe.textPreview,
    })),
    dynamicEndpointProbes: toDynamicSummary(dynamicProbes),
    fieldsByEndpoint: discoveredFields,
    documentedFields: DOCUMENTED_FIELDS,
    displaySuggestions: buildDisplaySuggestions(),
    notes: [
      'Ce fichier fusionne champs documentes + champs observes en live.',
      'Relance le script quand l API est en ligne pour enrichir les exemples.',
      'Les endpoints raw peuvent etre volumineux: ils sont limites a un UUID echantillon.',
    ],
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`API catalog generated: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
