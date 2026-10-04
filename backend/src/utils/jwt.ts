import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

/** Shape of the data we embed inside every access token. */
export interface TokenPayload {
  sub: string; // user id
}

export function signToken(userId: string): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId } satisfies TokenPayload, env.jwtSecret, options);
}

/** Verifies signature + expiry. Throws if the token is invalid. */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Malformed token payload');
  }
  return { sub: decoded.sub };
}
