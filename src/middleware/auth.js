import { ApiError } from '../utils/ApiError.js';

export const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return next(ApiError.unauthorized('Authentication required'));
};

export const ensureAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return next(ApiError.forbidden('Admin access required'));
};
