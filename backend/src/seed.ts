/**
 * Seeds sample data for demos / manual testing.
 *
 *   npm run seed                    → (re)creates demo@taskflow.app / Demo1234 with sample tasks
 *   npm run seed -- you@example.com → adds the sample tasks to an EXISTING account instead
 *
 * Only the target user's tasks are replaced - nothing else in the database is touched.
 * Dates are generated relative to "now" so the data always looks fresh:
 * some tasks are overdue, some due today, some next week, some already done.
 */
import dns from 'dns';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { User } from './models/User';
import { Task, type Category, type Priority } from './models/Task';

// Same DNS settings as server.ts so Atlas `mongodb+srv://` lookups resolve.
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const DEMO = { name: 'Demo User', email: 'demo@taskflow.app', password: 'Demo1234' };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

interface SampleTask {
  title: string;
  description: string;
  /** Offsets from now, in ms (negative = in the past). */
  start: number;
  due: number;
  priority: Priority;
  category: Category;
  completed?: boolean;
}

const SAMPLE_TASKS: SampleTask[] = [
  // --- Overdue ---------------------------------------------------------------
  { title: 'Pay electricity bill', description: 'Due date passed - pay online to avoid the late fee.', start: -2 * DAY, due: -5 * HOUR, priority: 'high', category: 'personal' },
  { title: 'Reply to client feedback', description: 'Address the 3 comments on the dashboard mockups.', start: -DAY, due: -2 * HOUR, priority: 'medium', category: 'work' },

  // --- Due today ---------------------------------------------------------------
  { title: 'Submit React Native assignment', description: 'Push the repo, record a short demo video and share the link.', start: -HOUR, due: 3 * HOUR, priority: 'high', category: 'study' },
  { title: 'Team stand-up notes', description: 'Summarise blockers and share in the channel.', start: 30 * 60_000, due: 2 * HOUR, priority: 'low', category: 'work' },
  { title: 'Evening run - 5 km', description: 'Easy pace, stretch afterwards.', start: 6 * HOUR, due: 8 * HOUR, priority: 'medium', category: 'health' },

  // --- This week -------------------------------------------------------------
  { title: 'Prepare sprint demo', description: 'Slides + live demo of the smart sort feature.', start: DAY, due: 2 * DAY, priority: 'high', category: 'work' },
  { title: 'Revise MongoDB indexing', description: 'Compound indexes, explain(), covered queries.', start: DAY + 4 * HOUR, due: 3 * DAY, priority: 'medium', category: 'study' },
  { title: 'Book dentist appointment', description: '', start: 2 * DAY, due: 4 * DAY, priority: 'low', category: 'health' },
  { title: 'Grocery shopping', description: 'Milk, eggs, spinach, rice, coffee beans.', start: 2 * DAY + 3 * HOUR, due: 2 * DAY + 6 * HOUR, priority: 'medium', category: 'personal' },

  // --- Later -----------------------------------------------------------------
  { title: 'Plan weekend trip', description: 'Compare train vs. bus, shortlist 2 hostels.', start: 5 * DAY, due: 9 * DAY, priority: 'low', category: 'other' },
  { title: 'Renew passport', description: 'Gather documents and book the appointment slot.', start: 7 * DAY, due: 21 * DAY, priority: 'high', category: 'personal' },
  { title: 'Read "Clean Code" ch. 4-6', description: '', start: 3 * DAY, due: 14 * DAY, priority: 'low', category: 'study' },

  // --- Completed -------------------------------------------------------------
  { title: 'Set up Expo project', description: 'TypeScript template + Expo Router.', start: -3 * DAY, due: -2 * DAY, priority: 'high', category: 'study', completed: true },
  { title: 'Morning yoga', description: '20 minutes.', start: -4 * HOUR, due: -3 * HOUR, priority: 'low', category: 'health', completed: true },
  { title: 'Design API endpoints', description: 'Auth + tasks CRUD, document in README.', start: -2 * DAY, due: -DAY, priority: 'medium', category: 'work', completed: true },
];

async function getTargetUser(email?: string) {
  if (email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new Error(`No account found for ${email}. Register in the app first.`);
    return user;
  }
  // Recreate the demo user so the password is always the documented one.
  await User.deleteOne({ email: DEMO.email });
  return User.create(DEMO); // password hashed by the pre-save hook
}

async function seed() {
  await connectDB();
  const user = await getTargetUser(process.argv[2]);

  const { deletedCount } = await Task.deleteMany({ user: user._id });
  if (deletedCount) console.log(`[seed] Removed ${deletedCount} existing task(s) for ${user.email}`);

  const now = Date.now();
  const docs = SAMPLE_TASKS.map((t) => ({
    user: user._id,
    title: t.title,
    description: t.description,
    dateTime: new Date(now + t.start),
    deadline: new Date(now + t.due),
    priority: t.priority,
    category: t.category,
    completed: !!t.completed,
    // Mark completed tasks as finished around their deadline.
    completedAt: t.completed ? new Date(Math.min(now, now + t.due)) : null,
  }));
  await Task.insertMany(docs);

  console.log(`[seed] Inserted ${docs.length} tasks for ${user.email}`);
  if (!process.argv[2]) console.log(`[seed] Log in with  ${DEMO.email} / ${DEMO.password}`);
}

seed()
  .catch((err) => {
    console.error('[seed] Failed:', err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
