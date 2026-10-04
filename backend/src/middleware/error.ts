import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

/** 404 for any route that wasn't matched. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Single place that converts every thrown error into a JSON response:
 *   { message: string, details?: unknown }
 * Express 5 forwards rejected promises from async handlers here automatically.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  // Malformed ObjectId in a URL param, e.g. /tasks/not-an-id
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid ${err.path}` });
    return;
  }

  // Duplicate key (unique index) - e.g. email already registered
  if (err?.code === 11000) {
    res.status(409).json({ message: 'An account with this email already exists' });
    return;
  }

  // Body-parser JSON syntax errors
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Malformed JSON body' });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({
    message: 'Something went wrong',
    ...(env.isProduction ? {} : { stack: err?.stack }),
  });
};
