import type { Request, Response } from 'express';
import { Task } from '../models/Task';
import { ApiError } from '../utils/ApiError';
import {
  listTasksQuerySchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../validators/task.schema';

/**
 * Every query below includes `user: req.userId`, so a user can only ever
 * see or touch their own tasks - even if they guess another task's id.
 */

/** GET /api/tasks?status=all|active|completed */
export async function listTasks(req: Request, res: Response) {
  const { status } = listTasksQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = { user: req.userId };
  if (status !== 'all') filter.completed = status === 'completed';

  // Default server order is by deadline; the app applies its own smart sort on top.
  const tasks = await Task.find(filter).sort({ deadline: 1, createdAt: -1 });
  res.json({ tasks });
}

/** GET /api/tasks/:id */
export async function getTask(req: Request, res: Response) {
  const task = await Task.findOne({ _id: req.params.id, user: req.userId });
  if (!task) throw ApiError.notFound('Task not found');
  res.json({ task });
}

/** POST /api/tasks */
export async function createTask(req: Request, res: Response) {
  const input = req.body as CreateTaskInput;
  const task = await Task.create({
    ...input,
    user: req.userId,
    completedAt: input.completed ? new Date() : null,
  });
  res.status(201).json({ task });
}

/** PATCH /api/tasks/:id - partial update (edit fields and/or completion). */
export async function updateTask(req: Request, res: Response) {
  const input = req.body as UpdateTaskInput;
  const task = await Task.findOne({ _id: req.params.id, user: req.userId });
  if (!task) throw ApiError.notFound('Task not found');

  // When only one of the dates changes, re-check the pair against the stored value.
  const dateTime = input.dateTime ?? task.dateTime;
  const deadline = input.deadline ?? task.deadline;
  if (deadline.getTime() < dateTime.getTime()) {
    throw ApiError.badRequest('Deadline must be after the scheduled date-time');
  }

  // Keep completedAt in sync with the completed flag.
  if (input.completed !== undefined && input.completed !== task.completed) {
    task.completedAt = input.completed ? new Date() : null;
  }

  task.set(input);
  await task.save();
  res.json({ task });
}

/** PATCH /api/tasks/:id/toggle - flip completed <-> active in one call. */
export async function toggleTask(req: Request, res: Response) {
  const task = await Task.findOne({ _id: req.params.id, user: req.userId });
  if (!task) throw ApiError.notFound('Task not found');

  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date() : null;
  await task.save();
  res.json({ task });
}

/** DELETE /api/tasks/:id */
export async function deleteTask(req: Request, res: Response) {
  const result = await Task.deleteOne({ _id: req.params.id, user: req.userId });
  if (result.deletedCount === 0) throw ApiError.notFound('Task not found');
  res.status(204).end();
}
