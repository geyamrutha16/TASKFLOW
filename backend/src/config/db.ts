import mongoose from 'mongoose';
import { env } from './env';

/** Opens the MongoDB connection used by all Mongoose models. */
export async function connectDB(): Promise<void> {
  mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
  mongoose.connection.on('error', (err) => console.error('[db] MongoDB error:', err));

  await mongoose.connect(env.mongoUri);
  console.log(`[db] Connected to ${mongoose.connection.name}`);
}
