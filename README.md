# Vector War

Real-world tactical war simulator MVP.

## Stack

- Backend: Node.js, Express, WebSockets, PostgreSQL via `pg`
- Auth: Discord OAuth2 with JWT sessions
- Frontend: React, Vite, Leaflet, OpenStreetMap tiles
- Simulation: server-authoritative tick loop with movement ETA, fog of war, and probabilistic combat

## Quick Start

```bash
npm run install:all
npm run dev
```

Backend defaults to `http://localhost:4000`.
Frontend defaults to `http://localhost:5173`.

If `DATABASE_URL` is missing, the backend runs in in-memory demo mode. That is useful for local testing, but Render + Neon should use Postgres.

## Environment

Create `backend/.env`:

```bash
PORT=4000
FRONTEND_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:4000
DATABASE_URL=postgresql://...
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=http://localhost:4000/auth/callback
JWT_SECRET=change-me
```

## Database

Run the schema in `backend/db/schema.sql` against Neon.

## Render

Use `render.yaml` as a starting point. Set the environment variables in Render, including `DATABASE_URL`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `JWT_SECRET`.

## MVP Loop

1. Login through Discord, or use demo login when OAuth vars are not configured.
2. Create or join a country.
3. Spawn starter units.
4. Select units on the map and issue movement orders.
5. Watch WebSocket state updates and combat events resolve server-side.
