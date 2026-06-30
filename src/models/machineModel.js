import { query } from '../config/database.js';

export const findMachineByCode = async (code) => {
  const { rows } = await query(
    'SELECT * FROM machines WHERE code = $1 LIMIT 1',
    [code]
  );
  return rows[0] || null;
};
