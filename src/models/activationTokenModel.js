import { query } from '../config/database.js';

// client param allows this insert to participate in a withTransaction block.
export const insertActivationToken = async ({ transactionId, machineId, token, expiresAt }, client) => {
  const runner = client ?? { query: (text, params) => query(text, params) };
  const { rows } = await runner.query(
    `INSERT INTO activation_tokens (transaction_id, machine_id, token, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [transactionId, machineId, token, expiresAt]
  );
  return rows[0];
};

export const findLatestTokenByTransaction = async (transactionId) => {
  const { rows } = await query(
    'SELECT * FROM activation_tokens WHERE transaction_id = $1 ORDER BY issued_at DESC LIMIT 1',
    [transactionId]
  );
  return rows[0] || null;
};
