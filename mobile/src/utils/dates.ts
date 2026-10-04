/** Small date helpers - kept dependency-free on purpose. */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const isOverdue = (deadline: string, completed: boolean) =>
  !completed && new Date(deadline).getTime() < Date.now();

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + DAY);
  const yesterday = new Date(today.getTime() - DAY);
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, tomorrow)) return 'Tomorrow';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const formatDateTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`;

/** "in 3h", "in 2d", "5m ago", "3d overdue" etc. */
export function relativeToNow(iso: string, overdueWording = false): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const value =
    abs < HOUR ? `${Math.max(1, Math.round(abs / MIN))}m`
    : abs < DAY ? `${Math.round(abs / HOUR)}h`
    : `${Math.round(abs / DAY)}d`;
  if (diff >= 0) return `in ${value}`;
  return overdueWording ? `${value} overdue` : `${value} ago`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Rounds up to the next quarter hour - a friendly default for new tasks. */
export function nextQuarterHour(from = new Date()): Date {
  const d = new Date(from);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil((d.getMinutes() + 1) / 15) * 15);
  return d;
}
