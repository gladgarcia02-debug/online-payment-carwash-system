import { query } from '../config/database.js';

export const findActiveServices = async () => {
  const { rows } = await query(
    'SELECT * FROM services WHERE is_active = TRUE ORDER BY name',
    []
  );
  return rows;
};

export const findActiveServiceByCode = async (code) => {
  const { rows } = await query(
    'SELECT * FROM services WHERE code = $1 AND is_active = TRUE LIMIT 1',
    [code]
  );
  return rows[0] || null;
};
