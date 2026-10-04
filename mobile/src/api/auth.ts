import { request } from './client';
import type { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { email, password }),

  me: () => request<{ user: User }>('GET', '/auth/me'),
};
