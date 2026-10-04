import { request } from './client';
import type { Task, TaskInput } from '../types';

export const tasksApi = {
  list: () => request<{ tasks: Task[] }>('GET', '/tasks'),

  create: (input: TaskInput) => request<{ task: Task }>('POST', '/tasks', input),

  update: (id: string, input: Partial<TaskInput>) =>
    request<{ task: Task }>('PATCH', `/tasks/${id}`, input),

  toggle: (id: string) => request<{ task: Task }>('PATCH', `/tasks/${id}/toggle`),

  remove: (id: string) => request<void>('DELETE', `/tasks/${id}`),
};
