import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validates `req.body` against a zod schema and replaces it with the
 * parsed (trimmed, coerced, defaulted) result. Controllers can therefore
 * trust `req.body` completely.
 */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      // Surface the first message as the headline so the app can show it directly.
      return next(ApiError.badRequest(details[0]?.message ?? 'Invalid request', details));
    }
    req.body = result.data;
    next();
  };
