// Process entrypoint. Plain JS run by Node directly (not through Vite), so it can
// only import runtime-loadable modules: the boot gate, headers and scanner gate
// live beside it as .js files.
//
// Express handles: crash handlers, boot gate, security headers, robots.txt,
// scanner probes, /downloads and /dance listings. Everything else goes to
// React Router (app/), via Vite in development and the built bundle in production.
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import serveIndex from 'serve-index';
import { securityHeaders } from './security-headers.js';
import { isScannerProbe } from './scanner-gate.js';
import { assertDependenciesSatisfied } from './dependencies.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const IS_DEV = process.env.NODE_ENV === 'development';
const PORT = 3000;
const HOST = '0.0.0.0';
// A variable, so the type checker doesn't look for build output that may not exist yet.
const BUILD_PATH = './build/server/index.js';

// Last-resort handlers. An uncaught exception leaves the process in an unknown
// state, so log it and exit; Dokku/Docker restarts the container.
process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[process] uncaught exception, exiting for restart:', err);
  process.exit(1);
});

// Before anything listens: a misconfigured deploy fails here, loudly.
assertDependenciesSatisfied();

const app = express();
app.disable('x-powered-by');

// Security headers, with a fresh CSP nonce per request. server/app.ts hands the
// nonce to React Router so its inline scripts are allowed.
app.use((_req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  for (const [name, value] of Object.entries(securityHeaders({ isDev: IS_DEV, nonce: res.locals.nonce }))) {
    res.setHeader(name, value);
  }
  next();
});

// Answered before the scanner gate and the request log.
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /api/\nDisallow: /mcdb/\n');
});

// Scanner probes: bare 404, no body, no log line.
app.use((req, res, next) => {
  if (isScannerProbe(req)) return res.status(404).end();
  next();
});

app.use((req, _res, next) => {
  if (!IS_DEV || !req.url.startsWith('/@') && !req.url.startsWith('/node_modules/') && !req.url.startsWith('/app/')) {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// Public file listings from the storage directory.
/** @param {string} dir */
const storage = (dir) => path.join(ROOT, 'storage', dir);
for (const dir of ['downloads', 'dance']) {
  app.use(`/${dir}`, express.static(storage(dir)), serveIndex(storage(dir), { icons: true, view: 'details' }));
}

// The JSON API is callable from other origins.
app.use('/api', cors());

// TLS terminates at Dokku's nginx in production; dev serves HTTPS itself.
const server = IS_DEV
  ? https.createServer({
      cert: fs.readFileSync(String(process.env.LOCALHOST_CERT)),
      ca: fs.readFileSync(String(process.env.LOCALHOST_CERT_AUTHORITY)),
      key: fs.readFileSync(String(process.env.LOCALHOST_CERT_KEY)),
    }, app)
  : http.createServer(app);

if (IS_DEV) {
  // Vite in middleware mode. HMR rides the same HTTPS server (no second port or cert).
  const vite = await import('vite');
  const viteDevServer = await vite.createServer({
    server: { middlewareMode: true, ws: { server } },
  });
  app.use(viteDevServer.middlewares);
  app.use(async (req, res, next) => {
    try {
      const source = await viteDevServer.ssrLoadModule('./server/app.ts');
      return await source.app(req, res, next);
    } catch (error) {
      if (error instanceof Error) viteDevServer.ssrFixStacktrace(error);
      next(error);
    }
  });
} else {
  // Built client assets have content hashes in their names, so cache them hard.
  app.use('/assets', express.static(path.join(ROOT, 'build/client/assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(path.join(ROOT, 'build/client'), { maxAge: '1h' }));
  app.use((await import(BUILD_PATH)).app);
}

server.listen(PORT, HOST, () => {
  console.log(`Listening on ${IS_DEV ? 'https' : 'http'}://${HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV || '<unset>'})`);
});
