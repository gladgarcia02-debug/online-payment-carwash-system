import helmet from 'helmet';
// Sets sensible security headers (CSP, HSTS, etc.). Tune CSP when the UI grows.
export const security = helmet();
