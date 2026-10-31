// Security response headers, set on every response by server.js.
// Kept here (not in Dokku's nginx config) so they're versioned with the app.

// Scripts: same-origin files, plus inline scripts carrying this request's nonce.
// React Router renders a few inline scripts (hydration data, module preloads);
// app/entry.server.tsx stamps each with the nonce, so 'unsafe-inline' isn't needed.
// Inline <style> is allowed because serve-index's /downloads and /dance listings
// use it, and data: images for serve-index's icons.
/** @param {string} nonce */
export const csp = (nonce) => [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// One year. No includeSubDomains/preload: those affect other 1cec0ld.net hosts
// and preload is effectively irreversible.
export const HSTS = 'max-age=31536000';

/**
 * @param {{ isDev: boolean, nonce: string }} opts
 * @returns {Record<string, string>}
 */
export function securityHeaders({ isDev, nonce }) {
  /** @type {Record<string, string>} */
  const headers = {
    // Dev only reports violations: Vite's dev client injects scripts the nonce doesn't cover.
    [isDev ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy']: csp(nonce),
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
