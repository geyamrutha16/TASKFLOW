import type { Priority, SortMode, Task } from '../types';

/**
 * ===========================================================================
 *  Smart sort - a blended "what should I do next?" ranking
 * ===========================================================================
 *
 * Sorting by a single field is misleading: a LOW priority task due in 20
 * minutes is more urgent than a HIGH priority task due next month, but a
 * HIGH task due tomorrow should beat a LOW task due tomorrow.
 *
 * So each open task gets an urgency score in [0, ~1.25] built from three
 * normalised signals:
 *
 *   score = 0.50 · deadlinePressure     (how close / overdue is the deadline?)
 *         + 0.30 · priorityWeight       (how important did the user say it is?)
 *         + 0.20 · schedulePressure     (has the planned start time arrived?)
 *
 *  deadlinePressure = 1 / (1 + hoursLeft / 24)
 *      → 1.0 due now, 0.5 due in 24h, 0.125 due in a week (smooth decay).
 *      Overdue tasks get 1 + up to 0.5 extra (grows over 48h) so they
 *      float to the very top.
 *
 *  priorityWeight   = high 1.0 · medium 0.6 · low 0.25
 *
 *  schedulePressure = 1 if the planned date-time has passed, otherwise
 *      1 / (1 + hoursUntilStart / 12) (half-weight 12h before start).
 *
 * Completed tasks always sink below open ones (most recently completed first).
 * Ties are broken by the earlier deadline, then the earlier creation time.
 */

const HOUR = 3_600_000;

export const PRIORITY_WEIGHT: Record<Priority, number> = { high: 1, medium: 0.6, low: 0.25 };
const PRIORITY_RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export function deadlinePressure(deadline: Date, now: Date): number {
  const hoursLeft = (deadline.getTime() - now.getTime()) / HOUR;
  if (hoursLeft <= 0) {
    // Overdue: bonus grows from 0 → 0.5 across the first 48h overdue.
    return 1 + Math.min(-hoursLeft / 48, 1) * 0.5;
  }
  return 1 / (1 + hoursLeft / 24);
}

export function schedulePressure(dateTime: Date, now: Date): number {
  const hoursUntil = (dateTime.getTime() - now.getTime()) / HOUR;
  return hoursUntil <= 0 ? 1 : 1 / (1 + hoursUntil / 12);
}

/** Urgency score for one task - exported so the UI can show a "heat" meter. */
export function urgencyScore(task: Task, now = new Date()): number {
  return (
    0.5 * deadlinePressure(new Date(task.deadline), now) +
    0.3 * PRIORITY_WEIGHT[task.priority] +
    0.2 * schedulePressure(new Date(task.dateTime), now)
  );
}

const time = (iso: string) => new Date(iso).getTime();
const byDeadline = (a: Task, b: Task) => time(a.deadline) - time(b.deadline);
const byCreated = (a: Task, b: Task) => time(a.createdAt) - time(b.createdAt);

/** Returns a new array sorted by the chosen mode. Never mutates the input. */
export function sortTasks(tasks: Task[], mode: SortMode, now = new Date()): Task[] {
  // Pre-compute scores once (O(n)) instead of inside the comparator (O(n log n)).
  const scores = new Map<string, number>();
  if (mode === 'smart') tasks.forEach((t) => scores.set(t.id, urgencyScore(t, now)));

  const compareOpen = (a: Task, b: Task): number => {
    switch (mode) {
      case 'smart':
        return scores.get(b.id)! - scores.get(a.id)! || byDeadline(a, b) || byCreated(a, b);
      case 'deadline':
        return byDeadline(a, b) || PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      case 'priority':
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || byDeadline(a, b);
      case 'dateTime':
        return time(a.dateTime) - time(b.dateTime) || byDeadline(a, b);
      case 'newest':
        return time(b.createdAt) - time(a.createdAt);
    }
  };

  return [...tasks].sort((a, b) => {
    // Open tasks first, completed at the bottom.
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.completed && b.completed && mode !== 'newest') {
      return time(b.completedAt ?? b.updatedAt) - time(a.completedAt ?? a.updatedAt);
    }
    return compareOpen(a, b);
  });
}

/** Buckets a score into a label/colour the UI can display. */
export function urgencyLevel(score: number): 'critical' | 'high' | 'moderate' | 'relaxed' {
  if (score >= 0.85) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'moderate';
  return 'relaxed';
}
