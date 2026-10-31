# 1cec0ld-backend

Small personal Express 5 API / file host for 1cec0ld.net. Plain JavaScript (ESM), no build step, no ORM. See README.md for routes, deploy and the boot gate.

## Conventions
- **One Dockerfile.** Dev vs prod differ only by the `NPM_OMIT` build arg (docker-compose.yml) and `NODE_ENV` (run.sh picks nodemon vs node). Don't add a second Dockerfile.
- **Deploy is a git push to Dokku**, which builds the Dockerfile. No CI.
- **New external dependency → declare it in `dependencies.js`** so a misconfigured deploy fails at boot. Errors from an unconfigured dependency name the dependency and the setting (never a secret's value), e.g. the 503 in `controllers/mc/McDb.js`.
- **The Minecraft SQLite DB is read-only.** It belongs to the PokemonServer plugin, which writes constantly. Never write to it, never expose a table that isn't in `ALLOWED_TABLES`, and never add `claude_messages` or other tables with player names/UUIDs.
- **Same-origin scripts only.** The CSP in `security-headers.js` blocks inline `<script>`; put page JS in a `.js` file next to the HTML.
- **Paths from the repo root**, not hard-coded `/usr/src/app` (see `config/Routes.js`).
- **This site does not send email.** Don't add Postmark or other mail providers.
- Testing is manual: start the server and curl the routes. No test suite or GitHub Actions by choice.
