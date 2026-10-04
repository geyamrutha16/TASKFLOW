import { Schema, model, Types } from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = ['personal', 'work', 'study', 'health', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ITask {
  user: Types.ObjectId;
  title: string;
  description: string;
  /** When the user plans to work on the task. */
  dateTime: Date;
  /** Hard due date - the task is "overdue" after this moment. */
  deadline: Date;
  priority: Priority;
  category: Category;
  completed: boolean;
  completedAt: Date | null;
}

const taskSchema = new Schema<ITask>(
  {
    // Every task belongs to exactly one user; all queries are scoped by it.
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: '', maxlength: 1000 },
    dateTime: { type: Date, required: true },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    category: { type: String, enum: CATEGORIES, default: 'personal' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        ret.user = String(ret.user);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Compound index for the most common query: "my tasks, by deadline".
taskSchema.index({ user: 1, deadline: 1 });

export const Task = model<ITask>('Task', taskSchema);
