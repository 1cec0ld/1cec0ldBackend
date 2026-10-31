// Security response headers, set on every response by server.js.
// Kept here (not in Dokku's nginx config) so they're versioned with the app.

// Everything this server renders uses same-origin scripts only. Inline <style>
// is allowed because serve-index's /downloads and /dance listings use it, and
// data: images for serve-index's icons.
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// One year. No includeSubDomains/preload: those affect other 1cec0ld.net hosts
// and preload is effectively irreversible.
export const HSTS = 'max-age=31536000';

export function securityHeaders({ isDev }) {
  const headers = {
    'Content-Security-Policy': CSP,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  // HSTS is keyed on host, not port: sending it from localhost would force
  // https on every other localhost service.
  if (!isDev) headers['Strict-Transport-Security'] = HSTS;
  return headers;
}
