import dotenv from 'dotenv';
dotenv.config();

// Fail fast: a misconfigured environment should never boot silently.
const required = ['DATABASE_URL', 'SESSION_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  tokenTtlMinutes: Number(process.env.TOKEN_TTL_MINUTES) || 10,
  isProd: (process.env.NODE_ENV || 'development') === 'production',
};
