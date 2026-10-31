import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import express from 'express';
import cors from 'cors';
import Routes from './config/Routes.js';
import { securityHeaders } from './security-headers.js';
import { isScannerProbe } from './scanner-gate.js';
import { assertDependenciesSatisfied } from './dependencies.js';

const IS_DEV = process.env.NODE_ENV === 'development';
const PORT = 3000;
const HOST = '0.0.0.0';

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

const SECURITY_HEADERS = securityHeaders({ isDev: IS_DEV });
app.use((req, res, next) => {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);
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
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(cors());

// /api/v1 prefix helper for version 1 routes
app.v1 = (method, route, handler) => {
  if (['get', 'post', 'put', 'delete'].includes(method)) app[method]('/api/v1' + route, handler);
  else console.log(`server.js: method not supported: ${method}`);
};

Routes.initialize(app);

// TLS terminates at Dokku's nginx in production; dev serves HTTPS itself.
const server = IS_DEV
  ? https.createServer({
      cert: fs.readFileSync(process.env.LOCALHOST_CERT),
      ca: fs.readFileSync(process.env.LOCALHOST_CERT_AUTHORITY),
      key: fs.readFileSync(process.env.LOCALHOST_CERT_KEY),
    }, app)
  : http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`Listening on ${IS_DEV ? 'https' : 'http'}://${HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV || '<unset>'})`);
});
