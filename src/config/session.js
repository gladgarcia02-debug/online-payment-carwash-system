import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './database.js';
import { config } from './env.js';

const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({ pool, tableName: 'sessions', createTableIfMissing: false }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.isProd,   // HTTPS-only cookies in production
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
});
