import type { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';
import type { LoginInput, RegisterInput } from '../validators/auth.schema';

/** POST /api/auth/register - create an account and log the user straight in. */
export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as RegisterInput;

  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user.id), user });
}

/** POST /api/auth/login - exchange credentials for a JWT. */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  // Password is `select: false` on the schema, so opt in explicitly here.
  const user = await User.findOne({ email }).select('+password');

  // Same message for "no such user" and "wrong password" so attackers
  // can't use the endpoint to discover which emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  res.json({ token: signToken(user.id), user });
}

/** GET /api/auth/me - who does this token belong to? Used to restore sessions. */
export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  res.json({ user });
}
