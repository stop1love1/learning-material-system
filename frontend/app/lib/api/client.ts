'use client';
import { setServerOnline } from './connection';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const TOKEN_KEY = 'lms-token';

export function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}
export function setToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type Options = Omit<RequestInit, 'body'> & { auth?: boolean; body?: unknown };

export async function apiFetch<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const { auth = true, headers, body, ...rest } = opts;
  const h: Record<string, string> = { 'Content-Type': 'application/json', ...(headers as Record<string, string>) };
  const token = getToken();
  if (auth && token) h.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects on a network-level failure (server down / unreachable).
    setServerOnline(false);
    throw new ApiError('Network request failed', 0, null);
  }
  // Got an HTTP response (even an error status) → the server is reachable.
  setServerOnline(true);

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    // Auto-logout on 401 — but only when a token was actually sent. A 401 from an
    // unauthenticated endpoint (login/forgot/reset use { auth:false }) is just a
    // credential error and must NOT clear the session or loop.
    if (res.status === 401 && auth && token) {
      clearToken();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('lms:unauthorized'));
    }
    const msg = data?.message ?? res.statusText;
    throw new ApiError(Array.isArray(msg) ? msg.join(', ') : String(msg), res.status, data);
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, o?: Options) => apiFetch<T>(path, { method: 'GET', ...o }),
  post: <T = unknown>(path: string, body?: unknown, o?: Options) => apiFetch<T>(path, { method: 'POST', body, ...o }),
  patch: <T = unknown>(path: string, body?: unknown, o?: Options) =>
    apiFetch<T>(path, { method: 'PATCH', body, ...o }),
  del: <T = unknown>(path: string, o?: Options) => apiFetch<T>(path, { method: 'DELETE', ...o }),
};

/** Build a query string from an object (skips null/undefined/''). */
export function qs(params: Record<string, unknown> = {}): string {
  const s = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return s ? `?${s}` : '';
}
