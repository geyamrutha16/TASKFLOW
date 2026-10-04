import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { authApi, type AuthResponse } from '../api/auth';
import { ApiError } from '../api/client';
import type { User } from '../types';

const TOKEN_KEY = 'taskflow.token';

/**
 * Auth lifecycle:
 *   'restoring'        → app just launched, checking SecureStore for a saved token
 *   'authenticated'    → we have a valid token + user
 *   'unauthenticated'  → show login/register
 */
type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: User | null;
  /** True while a login/register request is in flight (drives button spinners). */
  submitting: boolean;
  error: string | null;
}

const initialState: AuthState = {
  status: 'restoring',
  token: null,
  user: null,
  submitting: false,
  error: null,
};

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

// --- Thunks ----------------------------------------------------------------

/**
 * On launch: load the token from encrypted storage and validate it with
 * GET /auth/me. Resolves to null when there is no saved session.
 */
export const restoreSession = createAsyncThunk<User | null, void, { rejectValue: string }>(
  'auth/restore',
  async (_, { dispatch, rejectWithValue }) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return null;

    // Put the token in state first so the API client attaches it to /me.
    dispatch(authSlice.actions.tokenLoaded(token));
    try {
      return (await authApi.me()).user;
    } catch (e) {
      // Only forget the token if the server rejected it (not on a network blip).
      if (e instanceof ApiError && e.status === 401) await SecureStore.deleteItemAsync(TOKEN_KEY);
      return rejectWithValue(message(e));
    }
  },
);

export const login = createAsyncThunk<AuthResponse, { email: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await authApi.login(email.trim(), password);
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      return res;
    } catch (e) {
      return rejectWithValue(message(e));
    }
  },
);

export const register = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string },
  { rejectValue: string }
>('auth/register', async ({ name, email, password }, { rejectWithValue }) => {
  try {
    const res = await authApi.register(name.trim(), email.trim(), password);
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    return res;
  } catch (e) {
    return rejectWithValue(message(e));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
});

// --- Slice -----------------------------------------------------------------

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    tokenLoaded: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.status = payload ? 'authenticated' : 'unauthenticated';
      })
      // Saved token expired / server unreachable → back to the login screen.
      .addCase(restoreSession.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.status = 'unauthenticated';
      })
      // Logout: wipe everything (tasks slice listens for this too).
      .addCase(logout.fulfilled, () => ({ ...initialState, status: 'unauthenticated' as const }));

    // Login and register share identical state transitions.
    for (const thunk of [login, register]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.submitting = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          state.submitting = false;
          state.token = payload.token;
          state.user = payload.user;
          state.status = 'authenticated';
        })
        .addCase(thunk.rejected, (state, { payload }) => {
          state.submitting = false;
          state.error = payload ?? 'Something went wrong';
        });
    }
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
