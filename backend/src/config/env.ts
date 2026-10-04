import 'dotenv/config';

/**
 * Centralised, validated access to environment variables.
 * Failing fast on a missing secret is far better than silently
 * signing tokens with `undefined`.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  isProduction: process.env.NODE_ENV === 'production',
};
