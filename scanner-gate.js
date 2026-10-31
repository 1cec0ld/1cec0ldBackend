// Requests from vulnerability scanners get a bare 404 with no body and no log line.
// Every pattern targets a stack this server doesn't run (PHP, WordPress, Spring,
// Exchange, ...) or a secrets probe (.env, .git, .aws).
// Adapted from md-nexus, minus its "unknown file extension" rule: /downloads and
// /dance legitimately serve .zip/.jar/.mp3/etc.

export const SCANNER_METHODS = new Set([
  'PROPFIND', 'PROPPATCH', 'MKCOL', 'COPY', 'MOVE',
  'LOCK', 'UNLOCK', 'REPORT', 'MKCALENDAR', 'SEARCH',
]);

export const SCANNER_PATH_RE = new RegExp([
  String.raw`\.php([/?]|$)`,
  String.raw`/\.env([.\w-]*)?($|[/?])`,
  String.raw`/\.git[a-z-]*`,
  String.raw`/\.(aws|ssh|docker)/`,
  String.raw`/\.kube([/?]|$)`,
  String.raw`/vendor/`,
  String.raw`/wp-(admin|login|content|includes|json)`,
  String.raw`/phpmyadmin`,
  String.raw`/pma($|[/?])`,
  String.raw`/cgi-bin/`,
  String.raw`/containers/(json|create)`,
  String.raw`/v\d+\.\d+/containers/`,
  String.raw`/(owa|ecp)/`,
  String.raw`/actuator($|[/?])`,
  String.raw`/autodiscover([/?]|$)`,
  String.raw`/geoserver([/?]|$)`,
  String.raw`/credentials?([/?]|$)`,
  String.raw`^/console([/?]|$)`,
  String.raw`^/server-(status|info)([/?]|$)`,
].join('|'), 'i');

export function isScannerProbe(req) {
  if (SCANNER_METHODS.has(req.method) || SCANNER_PATH_RE.test(req.url)) return true;
  // Root has no write handler; scanners spray POST/PUT/DELETE at it.
  if (req.path === '/' && req.method !== 'GET' && req.method !== 'HEAD') return true;
  return false;
}
