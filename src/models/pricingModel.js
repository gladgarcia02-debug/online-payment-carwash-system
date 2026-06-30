import { query } from '../config/database.js';

export const findActivePricingByService = async (serviceId) => {
  const { rows } = await query(
    'SELECT * FROM pricing WHERE service_id = $1 AND is_active = TRUE ORDER BY duration_minutes',
    [serviceId]
  );
  return rows;
};

export const findActivePricingOption = async (serviceId, durationMinutes) => {
  const { rows } = await query(
    'SELECT * FROM pricing WHERE service_id = $1 AND duration_minutes = $2 AND is_active = TRUE LIMIT 1',
    [serviceId, durationMinutes]
  );
  return rows[0] || null;
};
