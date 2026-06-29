import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

// Central error handler — registered LAST so every thrown/forwarded error lands here.
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.statusCode || 500;
  if (status >= 500) logger.error(err.message, err.stack);

  const message = status >= 500 && config.isProd ? 'Internal server error' : err.message;

  // Browsers get an HTML page; API clients get JSON.
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    return res.status(status).render('error', { status, message });
  }
  return res.status(status).json({
    error: { message, ...(err.details ? { details: err.details } : {}) },
  });
};
