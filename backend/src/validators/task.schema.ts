import { z } from 'zod';
import { CATEGORIES, PRIORITIES } from '../models/Task';

/** Fields shared by create + update. Dates arrive as ISO strings and are coerced. */
const taskFields = {
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().trim().max(1000),
  dateTime: z.coerce.date({ error: 'Invalid date-time' }),
  deadline: z.coerce.date({ error: 'Invalid deadline' }),
  priority: z.enum(PRIORITIES),
  category: z.enum(CATEGORIES),
  completed: z.boolean(),
};

/** A deadline earlier than the scheduled time makes no sense - reject it. */
const deadlineAfterStart = (t: { dateTime?: Date; deadline?: Date }) =>
  !t.dateTime || !t.deadline || t.deadline.getTime() >= t.dateTime.getTime();

const deadlineIssue = {
  message: 'Deadline must be after the scheduled date-time',
  path: ['deadline'],
};

export const createTaskSchema = z
  .object({
    ...taskFields,
    description: taskFields.description.default(''),
    priority: taskFields.priority.default('medium'),
    category: taskFields.category.default('personal'),
    completed: taskFields.completed.optional(),
  })
  .refine(deadlineAfterStart, deadlineIssue);

export const updateTaskSchema = z
  .object(taskFields)
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, 'Provide at least one field to update')
  .refine(deadlineAfterStart, deadlineIssue);

export const listTasksQuerySchema = z.object({
  status: z.enum(['all', 'active', 'completed']).default('all'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
