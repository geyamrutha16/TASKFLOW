import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { tasksApi } from '../api/tasks';
import type { Category, SortMode, StatusFilter, Task, TaskInput } from '../types';
import { sortTasks } from '../utils/smartSort';
import { isOverdue, isSameDay } from '../utils/dates';
import { logout } from './authSlice';
import type { RootState } from './index';

/**
 * Tasks are stored normalised ({ ids, entities }) via an entity adapter,
 * which gives O(1) lookups/updates by id and ready-made CRUD reducers.
 */
const adapter = createEntityAdapter<Task>();

interface TasksExtraState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  /** UI preferences for the list screen. */
  sortMode: SortMode;
  statusFilter: StatusFilter;
  categoryFilter: Category | 'all';
  search: string;
}

const initialState = adapter.getInitialState<TasksExtraState>({
  status: 'idle',
  error: null,
  sortMode: 'smart',
  statusFilter: 'all',
  categoryFilter: 'all',
  search: '',
});

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

// --- Thunks ----------------------------------------------------------------

export const fetchTasks = createAsyncThunk<Task[], void, { rejectValue: string }>(
  'tasks/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return (await tasksApi.list()).tasks;
    } catch (e) {
      return rejectWithValue(message(e));
    }
  },
);

export const createTask = createAsyncThunk<Task, TaskInput, { rejectValue: string }>(
  'tasks/create',
  async (input, { rejectWithValue }) => {
    try {
      return (await tasksApi.create(input)).task;
    } catch (e) {
      return rejectWithValue(message(e));
    }
  },
);

export const updateTask = createAsyncThunk<
  Task,
  { id: string; changes: Partial<TaskInput> },
  { rejectValue: string }
>('tasks/update', async ({ id, changes }, { rejectWithValue }) => {
  try {
    return (await tasksApi.update(id, changes)).task;
  } catch (e) {
    return rejectWithValue(message(e));
  }
});

/** Optimistic: the checkbox flips instantly; reverted if the request fails. */
export const toggleTask = createAsyncThunk<Task, string, { rejectValue: string }>(
  'tasks/toggle',
  async (id, { rejectWithValue }) => {
    try {
      return (await tasksApi.toggle(id)).task;
    } catch (e) {
      return rejectWithValue(message(e));
    }
  },
);

/** Optimistic: removed from the list instantly; restored if the request fails. */
export const deleteTask = createAsyncThunk<string, Task, { rejectValue: string }>(
  'tasks/delete',
  async (task, { rejectWithValue }) => {
    try {
      await tasksApi.remove(task.id);
      return task.id;
    } catch (e) {
      return rejectWithValue(message(e));
    }
  },
);

/** "Undo" after delete: re-create the task with the same content. */
export const restoreTask = createAsyncThunk<Task, Task, { rejectValue: string }>(
  'tasks/restore',
  async (task, { rejectWithValue }) => {
    try {
      const { title, description, dateTime, deadline, priority, category } = task;
      const created = (await tasksApi.create({ title, description, dateTime, deadline, priority, category })).task;
      return task.completed ? (await tasksApi.toggle(created.id)).task : created;
    } catch (e) {
      return rejectWithValue(message(e));
    }
  },
);

// --- Slice -----------------------------------------------------------------

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setSortMode: (state, action: PayloadAction<SortMode>) => {
      state.sortMode = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<StatusFilter>) => {
      state.statusFilter = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<Category | 'all'>) => {
      state.categoryFilter = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    clearTasksError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        adapter.setAll(state, payload);
      })
      .addCase(fetchTasks.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload ?? 'Failed to load tasks';
      })

      .addCase(createTask.fulfilled, (state, { payload }) => adapter.addOne(state, payload))
      .addCase(restoreTask.fulfilled, (state, { payload }) => adapter.addOne(state, payload))
      .addCase(restoreTask.rejected, (state, { payload }) => {
        state.error = payload ?? 'Could not restore task';
      })
      .addCase(updateTask.fulfilled, (state, { payload }) => adapter.setOne(state, payload))

      // Optimistic toggle
      .addCase(toggleTask.pending, (state, { meta }) => {
        const task = state.entities[meta.arg];
        if (task) {
          task.completed = !task.completed;
          task.completedAt = task.completed ? new Date().toISOString() : null;
        }
      })
      .addCase(toggleTask.fulfilled, (state, { payload }) => adapter.setOne(state, payload))
      .addCase(toggleTask.rejected, (state, { meta, payload }) => {
        const task = state.entities[meta.arg];
        if (task) task.completed = !task.completed; // roll back
        state.error = payload ?? 'Could not update task';
      })

      // Optimistic delete
      .addCase(deleteTask.pending, (state, { meta }) => adapter.removeOne(state, meta.arg.id))
      .addCase(deleteTask.rejected, (state, { meta, payload }) => {
        adapter.addOne(state, meta.arg); // roll back
        state.error = payload ?? 'Could not delete task';
      })

      // Never leak one user's tasks into the next session.
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { setSortMode, setStatusFilter, setCategoryFilter, setSearch, clearTasksError } = tasksSlice.actions;
export default tasksSlice.reducer;

// --- Selectors -------------------------------------------------------------

export const {
  selectAll: selectAllTasks,
  selectById: selectTaskById,
} = adapter.getSelectors<RootState>((s) => s.tasks);

const selectUi = (s: RootState) => s.tasks;

/**
 * The list the home screen renders: filtered by status / category / search,
 * then ordered by the chosen sort mode. Memoised with createSelector so it
 * only recomputes when its inputs change. `now` is passed in so the smart
 * ranking can be refreshed on a timer.
 */
export const selectVisibleTasks = createSelector(
  [selectAllTasks, selectUi, (_: RootState, now: number) => now],
  (tasks, ui, now) => {
    const q = ui.search.trim().toLowerCase();
    const filtered = tasks.filter((t) => {
      if (ui.statusFilter === 'active' && t.completed) return false;
      if (ui.statusFilter === 'completed' && !t.completed) return false;
      if (ui.categoryFilter !== 'all' && t.category !== ui.categoryFilter) return false;
      if (q && !`${t.title} ${t.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return sortTasks(filtered, ui.sortMode, new Date(now));
  },
);

/** Aggregate numbers for the dashboard header and profile screen. */
export const selectStats = createSelector([selectAllTasks], (tasks) => {
  const today = new Date();
  const completed = tasks.filter((t) => t.completed).length;
  return {
    total: tasks.length,
    completed,
    active: tasks.length - completed,
    overdue: tasks.filter((t) => isOverdue(t.deadline, t.completed)).length,
    dueToday: tasks.filter((t) => !t.completed && isSameDay(new Date(t.deadline), today)).length,
    completedToday: tasks.filter((t) => t.completedAt && isSameDay(new Date(t.completedAt), today)).length,
    progress: tasks.length ? completed / tasks.length : 0,
    byPriority: {
      high: tasks.filter((t) => !t.completed && t.priority === 'high').length,
      medium: tasks.filter((t) => !t.completed && t.priority === 'medium').length,
      low: tasks.filter((t) => !t.completed && t.priority === 'low').length,
    },
  };
});
