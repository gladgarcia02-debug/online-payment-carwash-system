import { query } from '../config/database.js';

// client param allows this insert to participate in a withTransaction block.
export const insertSuccessfulPayment = async ({ transactionId, method, amount, providerReference }, client) => {
  const runner = client ?? { query: (text, params) => query(text, params) };
  const { rows } = await runner.query(
    `INSERT INTO payments (transaction_id, method, provider_reference, amount, status, paid_at)
     VALUES ($1, $2, $3, $4, 'success', NOW()) RETURNING *`,
    [transactionId, method, providerReference, amount]
  );
  return rows[0];
};
