# 1cec0ld-backend

Website, JSON API and file host for 1cec0ld.net: React Router 8 (framework mode, SSR) on an Express 5 server. Deployed with Dokku on the same VPS as the Minecraft server.

## Layout
| Path | What |
|---|---|
| `server.js` | Process entrypoint (plain JS, run by Node). Crash handlers, boot gate, security headers + per-request CSP nonce, robots.txt, scanner gate, `/downloads` + `/dance`. Mounts React Router via Vite in dev, the built bundle in production. |
| `server/app.ts` | React Router's Express request handler; passes the CSP nonce into the router context. |
| `app/` | The React Router app: `routes.ts` (route table), `root.tsx` (document shell), `entry.server.tsx` (adds the nonce to React Router's inline scripts), `routes/` (pages and `/api` resource routes), `lib/` (`*.server.ts` = server-only). |
| `dependencies.js`, `security-headers.js`, `scanner-gate.js`, `mcdb-path.js` | Plain-JS modules `server.js` needs before any app code loads. |

## What it serves
| Path | What |
|---|---|
| `/` | Home page |
| `/downloads`, `/dance` | Public file listings from `storage/` |
| `/mcdb`, `/mcdb/:table` | Read-only browser for the Minecraft PokemonServer SQLite DB (React pages) |
| `/api/v1/mc/tables`, `/api/v1/mc/tables/:table` | JSON API for the same data (allowlisted tables only) |
| `/api/v1/d/*` | Debug echoes of headers, query, params |
| `/api/v1/u/login` | Login stub (no real auth yet) |

Every response gets security headers (`security-headers.js`), including an enforced CSP of `script-src 'self' 'nonce-…'` with a fresh nonce per request: no `'unsafe-inline'`. Known scanner probes (`.env`, `.php`, `wp-admin`, ...) get a silent 404 (`scanner-gate.js`).

## Boot gate
`dependencies.js` runs before the server listens. If a declared dependency isn't satisfied, the process exits and lists every problem, so under Dokku the deploy fails instead of the site half-working.

| Dependency | Needs |
|---|---|
| `mcdb` | The SQLite file at `MC_DB_PATH` (default `/mcdata/pokemonserver.db`) |
| `dev-https` | `LOCALHOST_CERT`, `LOCALHOST_CERT_AUTHORITY`, `LOCALHOST_CERT_KEY` files (development only) |

To run without one on purpose, set `DEPENDENCIES_ABSENT=mcdb` (comma-separated). The waiver is logged on every boot.

## Local development
```
cp .env.example .env   # fill in cert paths; set DEPENDENCIES_ABSENT=mcdb if you have no local DB copy
npm run dev            # docker compose up --build, https://localhost:3000
```
In dev, edits under `app/` hot-reload through Vite (HMR over the same HTTPS port); edits to the root `.js` server files restart via nodemon. The CSP is report-only in dev.

Without Docker: `npm install`, then `NODE_ENV=development npm start`. For a production-like run: `npm run build && npm start` (plain HTTP).

Checks before committing: `npm run typecheck` and `npm run build`.

## Docker
One `Dockerfile` for both environments:
- **Production (Dokku):** the defaults. A builder stage runs `react-router build`; the slim runtime image gets production dependencies, the source and `build/`, and runs `node server.js`.
- **Dev (`docker-compose.yml`):** builds with `NPM_OMIT=""` to include devDependencies (Vite, nodemon), mounts the source, sets `NODE_ENV=development`. `run.sh` then starts nodemon with Node's `development` resolve condition (so Node and Vite load the same React Router build).

## Deploy
Push to the Dokku remote; Dokku builds the `Dockerfile`.

One-time setup on the VPS:
- Mount the Minecraft plugin's directory. Mount the whole directory, because SQLite needs the `-wal`/`-shm` files beside the `.db`. Don't mount it `:ro`; the app opens the DB read-only itself.
  - `dokku storage:mount <app> /home/ubuntu/mc/data/plugins/PokemonServer:/mcdata`
- Mount whatever backs `storage/` (`/downloads`, `/dance`) at `/usr/src/app/storage`.
- `dokku ps:restart <app>` after changing mounts.

## Minecraft DB browser
Reads the DB the PokemonServer plugin writes to constantly (WAL mode), so it only ever opens it read-only. Only the tables in `ALLOWED_TABLES` (`app/lib/mcdb.server.ts`) are visible; tables with player names/UUIDs (`claude_messages`, `deaths`, `fight_events`, ...) stay hidden. The plugin adds tables and columns without migrations, so the schema is read live on every request.

The pages are rendered on the server and hydrate in the browser; navigation is client-side. Every view is a URL you can bookmark or share:
`/mcdb/lab_fights?kit=iron&outcome=escaped&_sort=damage&_dir=asc&_page=2&_per=100`
- `<column>=<value>`: equality filter (click any cell to add one; click a filter chip to remove it)
- `_sort`, `_dir`: click a column header
- `_page`, `_per`: paging, with 25/100/500 rows per page
- Epoch-ms `*_at` columns show as UTC dates, `*_millis` as durations, and floats round to 3 places. Hover a cell for the raw value.
- ↗ links jump between related tables (`lab_runs` ↔ `lab_fights`, `groups` ↔ `mobs`; `RELATIONS` in `app/lib/format.ts`).

## Database
No ORM or MySQL client is installed. Dokku still has the old MySQL link env var (`DATABASE_URL`, from `dokku mysql:link`) set on the app; use that if a MySQL DB is needed again. If you add one: put the client in `app/lib/*.server.ts`, declare it in `dependencies.js`, and give every query a timeout (`mysql2` has no per-query timeout, so a dead socket otherwise hangs the request forever).
