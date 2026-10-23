import { demoHandle, isDemo } from './demo';

const BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, string[]>, public meta?: Record<string, number>) {
    super(message);
  }
}

let csrfToken: string | null = null;
export const setCsrf = (t: string | null) => { csrfToken = t; };

export async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  if (isDemo) {
    if (path.startsWith('/auth/verify-otp')) await new Promise((r) => setTimeout(r, 700)); // preview only: lets you see the "verifying" state
    const demo = demoHandle(method, path, body) as { __status?: number; __code?: string; __meta?: Record<string, number>; message?: string } | undefined;
    if (demo !== undefined) {
      if (demo.__status) throw new ApiError(demo.__status, demo.__code ?? (demo.__status === 401 ? 'UNAUTHORIZED' : 'DEMO'), demo.message ?? 'Authentication required', undefined, demo.__meta);
      return demo as T;
    }
  }
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method, credentials: 'include',
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(csrfToken && method !== 'GET' ? { 'X-CSRF-Token': csrfToken } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Serveur injoignable. Vérifiez votre connexion ou réessayez plus tard.');
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON body (e.g. a static host answering 404) */ }
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? 'HTTP_' + res.status, e?.message ?? `Erreur ${res.status}`, e?.details, e?.meta);
  }
  return json as T;
}

export interface User {
  id: string; username: string; email: string; role: 'USER' | 'ADMIN'; emailVerified: boolean; avatar: string | null;
  createdAt: string; lastLoginAt: string | null; twoFactorEnabled?: boolean; status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }
