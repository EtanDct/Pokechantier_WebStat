# PokeChantier WebStat

Frontend React + TanStack Query pour visualiser les données de `https://pokeapi.chantierland.com`.

## Stack

- React (Vite)
- TanStack Query
- React Router

## Démarrage

```bash
npm install
npm run dev
```

L'app démarre sur `http://localhost:5173`.

## Configuration API

Toutes les requêtes sont centralisées dans `src/api/pokechantierApi.js` et passent par une seule URL frontend: `/api`.

Le proxy Vite redirige `/api/*` vers `https://pokeapi.chantierland.com/api/*`, ce qui évite les erreurs CORS côté navigateur.
