import { query } from '../config/database.js';

// The model is the ONLY layer that writes SQL. No business logic lives here.
export const findUserByEmail = async (email) => {
  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1 AND is_active = TRUE LIMIT 1',
    [email]
  );
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const { rows } = await query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
};
