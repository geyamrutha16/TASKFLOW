import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validators/auth.schema';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), auth.register);
authRouter.post('/login', validateBody(loginSchema), auth.login);
authRouter.get('/me', requireAuth, auth.me);
