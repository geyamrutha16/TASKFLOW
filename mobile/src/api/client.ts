import Constants from 'expo-constants';

/**
 * Resolves the API base URL:
 *  1. EXPO_PUBLIC_API_URL if set (e.g. a deployed server or http://10.0.2.2:5000/api)
 *  2. Otherwise the IP of the machine running the Expo dev server - this is
 *     the same machine running the backend, so a phone on the same Wi-Fi
 *     using Expo Go can reach it with zero configuration.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.20:8081"
  const host = hostUri?.split(':')[0] ?? '10.0.2.2';
  return `http://${host}:5000/api`;
}

export const API_URL = resolveBaseUrl();

/** Error thrown for any non-2xx response, carrying the server's message. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// --- Token + 401 hooks -----------------------------------------------------
// The client doesn't import the store (that would create a circular import);
// instead the store registers these callbacks once at startup.
let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function configureApiClient(opts: { getToken: () => string | null; onUnauthorized: () => void }) {
  getToken = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** Thin typed wrapper around fetch: JSON in/out, auth header, timeout, errors. */
export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(
      0,
      aborted
        ? 'The server took too long to respond'
        : `Can't reach the server at ${API_URL}. Is the backend running?`,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // An expired/invalid token on an authenticated call → force logout.
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}
