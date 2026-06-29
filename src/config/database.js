import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

// One shared pool, created once and reused everywhere (DRY + connection reuse).
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
});

// Thin query helper so models never import the raw pool.
export const query = (text, params) => pool.query(text, params);

export const verifyConnection = async () => {
  const { rows } = await pool.query('SELECT NOW() AS now');
  return rows[0].now;
};
