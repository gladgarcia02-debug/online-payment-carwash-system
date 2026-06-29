import bcrypt from 'bcrypt';
import { findUserByEmail } from '../models/userModel.js';

// Business logic lives in the service layer: the model only touches the DB,
// passport (config) only orchestrates. Separation of concerns.
export const verifyCredentials = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;

  // Never let the password hash escape this layer.
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

export const hashPassword = (plain) => bcrypt.hash(plain, 12);
