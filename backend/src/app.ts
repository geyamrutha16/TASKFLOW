import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth.routes';
import { taskRouter } from './routes/task.routes';
import { errorHandler, notFound } from './middleware/error';

/**
 * Builds the Express app without starting it, so it can be reused by
 * tests or other entry points.
 */
export function createApp() {
  const app = express();

  // --- Global middleware -------------------------------------------------
  app.use(helmet()); // sensible security headers
  app.use(cors()); // the mobile app calls us from a different origin
  app.use(express.json({ limit: '100kb' }));
  app.use(morgan('dev')); // request logging

  // --- Routes ------------------------------------------------------------
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', taskRouter);

  // --- Fallbacks (must be last) -----------------------------------------
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
