import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';

// Make `req.userId` available (and typed) in every authenticated handler.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Guards private routes. Expects `Authorization: Bearer <jwt>`.
 * On success, attaches the authenticated user's id to `req.userId`.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing access token'));
  }

  try {
    const { sub } = verifyToken(header.slice('Bearer '.length));
    req.userId = sub;
    next();
  } catch {
    next(ApiError.unauthorized('Session expired, please log in again'));
  }
};
