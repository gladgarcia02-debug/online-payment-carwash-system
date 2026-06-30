import { query } from '../config/database.js';

export const insertTransaction = async ({ machineId, serviceId, durationMinutes, amount, currency }) => {
  const { rows } = await query(
    `INSERT INTO transactions (machine_id, service_id, duration_minutes, amount, currency)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [machineId, serviceId, durationMinutes, amount, currency]
  );
  return rows[0];
};

export const findTransactionById = async (id) => {
  const { rows } = await query(
    'SELECT * FROM transactions WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

export const findTransactionDetailById = async (id) => {
  const { rows } = await query(
    `SELECT t.*,
            s.code AS service_code, s.name AS service_name,
            m.code AS machine_code, m.name AS machine_name, m.location AS machine_location
     FROM transactions t
     JOIN services s ON s.id = t.service_id
     JOIN machines m ON m.id = t.machine_id
     WHERE t.id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

// Uses an explicit pg client so callers can include this in a withTransaction block.
export const markTransactionPaid = async (id, client) => {
  const { rows } = await client.query(
    `UPDATE transactions SET status = 'paid'
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id]
  );
  return rows[0] || null;
};
