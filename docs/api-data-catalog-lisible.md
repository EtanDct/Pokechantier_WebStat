# Catalogue API lisible

## 1) Donnees recuperees en live (dans l ordre des appels)

Snapshot: `2026-03-07T14:03:00Z`  
Probe live: `2026-03-07T14:02:49Z`
Re-verification manuelle: `2026-03-07T14:14:41Z`

Toutes les routes ci-dessous ont repondu en `HTTP 503` avec le message `no available server`.

1. `GET /api/health`
2. `GET /api/players`
3. `GET /api/leaderboard`
4. `GET /api/pokedex`
5. `GET /api/pokedex/files`
6. `GET /api/pokedex/tree`
7. `GET /api/stats/files`
8. `GET /api/storage/files`
9. `GET /api/debug/world`
10. `GET /api/debug/identity`

Conclusion live: aucune valeur metier n a pu etre lue ce jour, uniquement l etat d indisponibilite de l API.

## 2) Champs disponibles par endpoint (schema exploitable)

### `GET /api/health`
- `status`
- `timestamp`

### `GET /api/players`
- `count`
- `players[].uuid`
- `players[].shortUuid`
- `players[].name`
- `players[].hasStats`
- `players[].hasPokedex`
- `error`
- `cached`

### `GET /api/players/:uuid/profile`
- `ok`
- `uuid`
- `shortUuid`
- `name`
- `pokedex.count`
- `pokedex.seen`
- `pokedex.caught`
- `pokedex.completion`
- `pokedex.completionFormatted`
- `pokedex.shinyCaught`
- `pokedex.shinySeen`
- `stats.playTime.ticks`
- `stats.playTime.hours`
- `stats.playTime.minutes`
- `stats.playTime.formatted`
- `stats.deaths`
- `stats.mobKills`
- `stats.damageDealt`
- `stats.damageTaken`
- `stats.jumps`
- `stats.leaveGame`
- `stats.distances.walkKm`
- `stats.distances.sprintKm`
- `stats.distances.swimKm`
- `stats.distances.flyKm`
- `stats.distances.fallKm`
- `stats.distances.climbKm`
- `stats.cobblemon.caught`
- `stats.cobblemon.registered`
- `stats.cobblemon.shinyCaught`
- `error`

### `GET /api/leaderboard`
- `count`
- `ranking[].rank`
- `ranking[].uuid`
- `ranking[].shortUuid`
- `ranking[].name`
- `ranking[].count`
- `ranking[].seen`
- `ranking[].caught`
- `ranking[].completion`
- `ranking[].completionFormatted`
- `ranking[].shinyCaught`
- `ranking[].shinySeen`
- `cached`

### `GET /api/pokedex`
- `found`
- `path`
- `entries[]`
- `error`

### `GET /api/pokedex/files`
- `exists`
- `path`
- `count`
- `entries[]`
- `error`

### `GET /api/pokedex/tree`
- `exists`
- `path`
- `subdir_count`
- `total_files`
- `tree[].prefix`
- `tree[].files[]`
- `tree[].count`
- `tree[].note`
- `error`

### `GET /api/pokedex/:uuid/summary`
- `ok`
- `uuid`
- `count`
- `seen`
- `caught`
- `pokemon[].species`
- `pokemon[].knowledge`
- `pokemon[].shiny`
- `pokemon[].gender`
- `pokemon[].form`
- `error`

### `GET /api/pokedex/:uuid`
- `ok`
- `uuid`
- `path`
- `raw`
- `error`

### `GET /api/stats/files`
- `exists`
- `path`
- `count`
- `entries[]`
- `error`

### `GET /api/stats/:uuid`
- `ok`
- `uuid`
- `name`
- `playTime.ticks`
- `playTime.hours`
- `playTime.minutes`
- `playTime.formatted`
- `deaths`
- `mobKills`
- `damageDealt`
- `damageTaken`
- `jumps`
- `leaveGame`
- `distances.walkKm`
- `distances.sprintKm`
- `distances.swimKm`
- `distances.flyKm`
- `distances.fallKm`
- `distances.climbKm`
- `cobblemon.caught`
- `cobblemon.registered`
- `cobblemon.shinyCaught`
- `error`

### `GET /api/stats/raw/:uuid`
- `stats`

### `GET /api/storage/files`
- `exists`
- `path`
- `count`
- `entries[]`
- `error`

### `GET /api/debug/world`
- `exists`
- `path`
- `entries[]`
- `error`

### `GET /api/debug/identity`
- `usercache[].path`
- `usercache[].accessible`
- `usercache[].entries`
- `usercache[].sample.name`
- `usercache[].sample.uuid`
- `usercache[].reason`
- `ftbEssentials.accessible`
- `ftbEssentials.snbtFiles`
- `ftbEssentials.files[]`
- `ftbEssentials.reason`

## 3) Groupes prets a afficher

### Bloc dashboard
- `GET /api/players -> count`
- `GET /api/leaderboard -> count`
- `GET /api/leaderboard -> ranking[].completion`
- `GET /api/health -> status`
- `GET /api/health -> timestamp`

### Tableau classement
- `GET /api/leaderboard -> ranking[].rank`
- `GET /api/leaderboard -> ranking[].name`
- `GET /api/leaderboard -> ranking[].caught`
- `GET /api/leaderboard -> ranking[].seen`
- `GET /api/leaderboard -> ranking[].completionFormatted`
- `GET /api/leaderboard -> ranking[].shinyCaught`
- `GET /api/leaderboard -> ranking[].shinySeen`

### Fiche joueur
- `GET /api/players/:uuid/profile -> name`
- `GET /api/players/:uuid/profile -> pokedex.count`
- `GET /api/players/:uuid/profile -> pokedex.caught`
- `GET /api/players/:uuid/profile -> pokedex.completionFormatted`
- `GET /api/players/:uuid/profile -> stats.playTime.formatted`
- `GET /api/players/:uuid/profile -> stats.deaths`
- `GET /api/players/:uuid/profile -> stats.mobKills`
- `GET /api/players/:uuid/profile -> stats.distances.sprintKm`
- `GET /api/players/:uuid/profile -> stats.cobblemon.shinyCaught`

### Monitoring infra
- `GET /api/debug/world -> exists`
- `GET /api/debug/world -> entries[]`
- `GET /api/debug/identity -> usercache[].accessible`
- `GET /api/debug/identity -> ftbEssentials.accessible`
- `GET /api/storage/files -> count`
