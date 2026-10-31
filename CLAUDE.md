# 1cec0ld-backend

Personal site for 1cec0ld.net: React Router 8 framework mode (SSR, TypeScript) on Express 5, built with Vite. No ORM. See README.md for layout, routes, deploy and the boot gate.

## Conventions
- **One Dockerfile.** Dev vs prod differ only by the `NPM_OMIT` build arg (docker-compose.yml) and `NODE_ENV` (run.sh picks nodemon vs node). Don't add a second Dockerfile.
- **Deploy is a git push to Dokku**, which builds the Dockerfile. No CI.
- **New external dependency → declare it in `dependencies.js`** so a misconfigured deploy fails at boot. Errors from an unconfigured dependency name the dependency and the setting (never a secret's value), e.g. `mcdbFailure` in `app/lib/api.server.ts`.
- **The Minecraft SQLite DB is read-only.** It belongs to the PokemonServer plugin, which writes constantly. Never write to it, and never show UUID columns: `columnsOf` in `app/lib/mcdb.server.ts` drops them (by name or by content) and every query selects only those visible columns. All tables are public by choice.
- **CSP is nonce-based and enforced.** `server.js` makes a nonce per request; `server/app.ts` puts it in the router context; `app/entry.server.tsx` passes it to `<ServerRouter nonce>`. Never add `'unsafe-inline'` to `script-src` or render inline scripts without the nonce.
- **Server-only code lives in `*.server.ts`** (DB access, Node APIs). Shared types/pure helpers go in plain modules (e.g. `app/lib/format.ts`) so client bundles never import server code.
- **API endpoints are resource routes** under `app/routes/api/` (loader/action only, return `Response.json`). Unknown `/api/*` paths answer JSON 404.
- **Loader redirects:** build URLs from params, not `request.url`'s pathname. On client navigation the request is for `<path>.data`.
- **Root `.js` files run under Node directly**, before Vite or the build: keep them plain JS (with JSDoc types for `tsc`), and don't import `app/` code from them.
- Run `npm run typecheck` and `npm run build` before declaring a change done.
- **Paths from the repo root**, not hard-coded `/usr/src/app` (see `server.js`).
- **This site does not send email.** Don't add Postmark or other mail providers.
- Testing is manual: build, start the server and curl/browse the routes. No test suite or GitHub Actions by choice.
