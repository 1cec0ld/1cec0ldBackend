# 1cec0ld-backend

Express API and file host for 1cec0ld.net. Deployed with Dokku on the same VPS as the Minecraft server.

## What it serves
| Path | What |
|---|---|
| `/` | Health check / hello |
| `/downloads`, `/dance` | Public file listings from `storage/` |
| `/mcdb`, `/mcdb/:table` | Read-only browser for the Minecraft PokemonServer SQLite DB (server-rendered HTML tables) |
| `/api/v1/mc/tables`, `/api/v1/mc/tables/:table` | JSON API behind `/mcdb` (allowlisted tables only) |
| `/api/v1/d/*` | Debug echoes of headers, query, params |
| `/api/v1/u/login` | Login stub (no real auth yet) |

Every response gets security headers (`security-headers.js`). Known scanner probes (`.env`, `.php`, `wp-admin`, ...) get a silent 404 (`scanner-gate.js`).

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
npm run dev            # docker compose up --build, https://localhost:3000, nodemon reloads on save
```
Without Docker: `npm install`, then `NODE_ENV=development npm start` (or leave `NODE_ENV` unset for plain HTTP).

## Docker
One `Dockerfile` for both environments:
- **Production (Dokku):** the defaults. Installs production dependencies only and runs `node server.js`.
- **Dev (`docker-compose.yml`):** builds with `NPM_OMIT=""` to include devDependencies, mounts the source, sets `NODE_ENV=development`. `run.sh` then starts nodemon.

## Deploy
Push to the Dokku remote; Dokku builds the `Dockerfile`.

One-time setup on the VPS:
- Mount the Minecraft plugin's directory. Mount the whole directory, because SQLite needs the `-wal`/`-shm` files beside the `.db`. Don't mount it `:ro`; the app opens the DB read-only itself.
  - `dokku storage:mount <app> /home/ubuntu/mc/data/plugins/PokemonServer:/mcdata`
- Mount whatever backs `storage/` (`/downloads`, `/dance`) at `/usr/src/app/storage`.
- `dokku ps:restart <app>` after changing mounts.

## Minecraft DB browser
Reads the DB the PokemonServer plugin writes to constantly (WAL mode), so it only ever opens it read-only. Only the tables in `ALLOWED_TABLES` (`util/McDb.js`) are visible; tables with player names/UUIDs (`claude_messages`, `deaths`, `fight_events`, ...) stay hidden. The plugin adds tables and columns without migrations, so the schema is read live on every request.

The pages are rendered on the server with no client JS, so every view is a URL you can bookmark or share:
`/mcdb/lab_fights?kit=iron&outcome=escaped&_sort=damage&_dir=asc&_page=2&_per=100`
- `<column>=<value>`: equality filter (click any cell to add one; click a filter chip to remove it)
- `_sort`, `_dir`: click a column header
- `_page`, `_per`: paging, with 25/100/500 rows per page
- Epoch-ms `*_at` columns show as UTC dates, `*_millis` as durations, and floats round to 3 places. Hover a cell for the raw value.
- ↗ links jump between related tables (`lab_runs` ↔ `lab_fights`, `groups` ↔ `mobs`; `RELATIONS` in `controllers/mc/McDbPages.js`).

## Database
No ORM or MySQL client is installed. Dokku still has the old MySQL link env var set on the app; hook into that if a MySQL DB is needed again (see the commented-out `util/MySQL.js`).
