import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer, { logout } from './authSlice';
import tasksReducer from './tasksSlice';
import { configureApiClient } from '../api/client';

/**
 * Global Redux store.
 *  - auth:  session / user / token
 *  - tasks: normalised task entities + list UI preferences
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Wire the API client to the store: it reads the current token and
// triggers a logout when the server says the token is no longer valid.
configureApiClient({
  getToken: () => store.getState().auth.token,
  onUnauthorized: () => {
    if (store.getState().auth.status === 'authenticated') store.dispatch(logout());
  },
});

/** Typed hooks - use these instead of plain useDispatch/useSelector. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
