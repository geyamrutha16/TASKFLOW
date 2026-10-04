/** Domain types shared across the app. They mirror the backend's JSON. */

export type Priority = 'low' | 'medium' | 'high';
export type Category = 'personal' | 'work' | 'study' | 'health' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  /** ISO string - when the user plans to work on it. */
  dateTime: string;
  /** ISO string - when it is due. */
  deadline: string;
  priority: Priority;
  category: Category;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating / editing a task (dates as ISO strings). */
export interface TaskInput {
  title: string;
  description: string;
  dateTime: string;
  deadline: string;
  priority: Priority;
  category: Category;
}

export type SortMode = 'smart' | 'deadline' | 'priority' | 'dateTime' | 'newest';
export type StatusFilter = 'all' | 'active' | 'completed';
