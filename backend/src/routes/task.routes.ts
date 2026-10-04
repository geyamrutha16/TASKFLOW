import { Router } from 'express';
import * as tasks from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema } from '../validators/task.schema';

export const taskRouter = Router();

// All task routes are private.
taskRouter.use(requireAuth);

taskRouter.get('/', tasks.listTasks);
taskRouter.post('/', validateBody(createTaskSchema), tasks.createTask);
taskRouter.get('/:id', tasks.getTask);
taskRouter.patch('/:id', validateBody(updateTaskSchema), tasks.updateTask);
taskRouter.patch('/:id/toggle', tasks.toggleTask);
taskRouter.delete('/:id', tasks.deleteTask);
