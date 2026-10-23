/**
 * PREVIEW ONLY. Enabled by VITE_DEMO=1 at build time (the interactive preview build).
 * It lets you look at the signed-in and admin screens without a server. It never fakes results of real
 * features (logins, downloads): those still go to the network and fail honestly.
 */
import { useSyncExternalStore } from 'react';

export const isDemo = import.meta.env.VITE_DEMO === '1';
export type DemoRole = 'visitor' | 'user' | 'admin';

let role: DemoRole = 'visitor';
const listeners = new Set<() => void>();
export const getDemoRole = () => role;
export function setDemoRole(r: DemoRole) { role = r; listeners.forEach((l) => l()); }
export const useDemoRole = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, getDemoRole);

const mkUser = (i: number, username: string, r: 'USER' | 'ADMIN', status: string, verified = true) => ({
  id: String(i).padStart(24, '0'), username, email: `${username}@exemple.com`, role: r, emailVerified: verified, avatar: null,
  createdAt: new Date(Date.UTC(2026, 9, 14 - i)).toISOString(), lastLoginAt: i % 4 === 3 ? null : new Date(Date.UTC(2026, 9, 14, 12 - i)).toISOString(), status,
});
const USERS = [mkUser(1, 'utilisateur01', 'ADMIN', 'ACTIVE'), mkUser(2, 'utilisateur02', 'USER', 'ACTIVE'), mkUser(3, 'utilisateur03', 'USER', 'ACTIVE'),
  mkUser(4, 'utilisateur04', 'USER', 'SUSPENDED'), mkUser(5, 'utilisateur05', 'USER', 'ACTIVE', false), mkUser(6, 'utilisateur06', 'USER', 'ACTIVE')];
const LOGS = ['LOGIN', 'REGISTER', 'EMAIL_VERIFIED', 'ADMIN_ROLE_CHANGED', 'PASSWORD_RESET_REQUESTED', 'LOGIN_FAILED'].map((action, i) => ({
  id: String(i), actorId: USERS[i % 3]!.id, action, targetId: null, metadata: {}, timestamp: new Date(Date.UTC(2026, 9, 14, 15 - i)).toISOString(),
}));

// --- API keys (sample data; created demo keys are explicitly fake and never valid) ---
interface DKey { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null; requests: number; errors: number; periodRequests: number; periodErrors: number }
const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
let DKEYS: DKey[] = [
  { id: 'a1', name: 'Application mobile', prefix: 'mh_live_Qx7Kd2', createdAt: ago(24 * 20), lastUsedAt: ago(0.02), revokedAt: null, requests: 18420, errors: 212, periodRequests: 1860, periodErrors: 21 },
  { id: 'a2', name: 'Bot Discord', prefix: 'mh_live_P9mT4w', createdAt: ago(24 * 9), lastUsedAt: ago(3), revokedAt: null, requests: 2310, errors: 18, periodRequests: 245, periodErrors: 2 },
  { id: 'a3', name: 'Test local', prefix: 'mh_live_Zc1Rb8', createdAt: ago(24 * 30), lastUsedAt: ago(24 * 12), revokedAt: ago(24 * 11), requests: 97, errors: 5, periodRequests: 0, periodErrors: 0 },
];
const RANGE_N: Record<string, [number, number]> = { '24h': [24, 3_600_000], '7d': [7, 86_400_000], '30d': [30, 86_400_000] };
function demoSeries(range: string, target: number) {
  const [n, step] = RANGE_N[range] ?? RANGE_N['24h']!;
  const base = Math.floor(Date.now() / step) * step;
  const raw = Array.from({ length: n }, (_, i) => 1 + 0.6 * Math.sin(i / 2.3) + 0.3 * Math.cos(i / 1.1) + 0.1);
  const k = target / raw.reduce((a, b) => a + b, 0);
  return raw.map((v, i) => { const requests = Math.round(v * k); return { t: new Date(base - (n - 1 - i) * step).toISOString(), requests, errors: Math.round(requests * 0.011) }; });
}
export const DEMO_KEY_NOTICE = 'mh_live_EXEMPLE_cle_factice_non_valide';

// --- OTP preview: NO e-mail is sent and nothing is verified for real. The accepted code is fixed and shown on screen. ---
export const DEMO_OTP = '1234';
let otpAttempts = 0; let otpLocked = false; let lastResend = 0;

// --- 2FA preview: the secret is a fixed fake, the accepted code is 123456. Nothing is protected. ---
export const DEMO_2FA_CODE = '123456';
export const DEMO_2FA_SECRET = 'EXEMPLEFACTICEPASVALIDE234567';
let demo2fa = false;

export function currentDemoUser() {
  if (role === 'visitor') return null;
  return { ...USERS[role === 'admin' ? 0 : 1]!, role: role === 'admin' ? 'ADMIN' : 'USER', twoFactorEnabled: demo2fa };
}

/** Returns a response for admin/me endpoints, or undefined to let the request go to the network. */
export function demoHandle(method: string, path: string, body?: unknown): unknown | undefined {
  const [p = '', qs] = path.split('?');
  const q = new URLSearchParams(qs);
  if (method === 'GET' && p === '/auth/me') {
    const u = currentDemoUser();
    return u ? { user: u, csrfToken: 'demo' } : { __status: 401 };
  }
  if (method === 'POST' && p === '/auth/register') return { status: 'pending' };
  if (role !== 'visitor' && p.startsWith('/auth/2fa/')) {
    const code = (body as { code?: string } | undefined)?.code;
    if (p === '/auth/2fa/setup') return { secret: DEMO_2FA_SECRET, otpauthUri: `otpauth://totp/Media%20Hub:apercu?secret=${DEMO_2FA_SECRET}&issuer=Media%20Hub` };
    if (p === '/auth/2fa/enable') {
      if (code !== DEMO_2FA_CODE) return { __status: 400, __code: 'BAD_REQUEST', message: 'Code incorrect' };
      demo2fa = true; return { recoveryCodes: ['exemple-aaaaa', 'exemple-bbbbb', 'exemple-ccccc', 'exemple-ddddd', 'exemple-eeeee', 'exemple-fffff', 'exemple-ggggg', 'exemple-hhhhh'] };
    }
    if (p === '/auth/2fa/disable') { demo2fa = false; return { ok: true }; }
  }
  if (method === 'POST' && p === '/auth/resend-otp') {
    const wait = 60_000 - (Date.now() - lastResend);
    if (lastResend && wait > 0) return { __status: 429, __code: 'RATE_LIMITED', message: 'Veuillez patienter avant de redemander un code.', __meta: { retryAfter: Math.ceil(wait / 1000) } };
    lastResend = Date.now(); otpAttempts = 0; otpLocked = false;
    return { retryAfter: 60 };
  }
  if (method === 'POST' && p === '/auth/verify-otp') {
    if (otpLocked) return { __status: 429, __code: 'OTP_LOCKED', message: 'Trop d’essais. Demandez un nouveau code.' };
    if ((body as { code?: string } | undefined)?.code === DEMO_OTP) { otpAttempts = 0; setDemoRole('user'); return { user: currentDemoUser(), csrfToken: 'demo' }; }
    otpAttempts += 1;
    if (otpAttempts >= 5) { otpLocked = true; return { __status: 429, __code: 'OTP_LOCKED', message: 'Trop d’essais. Demandez un nouveau code.' }; }
    return { __status: 400, __code: 'OTP_INVALID', message: 'Code incorrect.', __meta: { attemptsLeft: 5 - otpAttempts } };
  }
  if (role !== 'visitor') {
    const sum = (k: 'periodRequests' | 'periodErrors') => DKEYS.reduce((a, x) => a + x[k], 0);
    if (method === 'GET' && p === '/keys') return { items: DKEYS.map(({ periodRequests: _a, periodErrors: _b, ...k }) => k) };
    if (method === 'GET' && p === '/keys/usage') {
      const r = q.get('range') ?? '24h'; const f = r === '24h' ? 1 : r === '7d' ? 7 : 30;
      const requests = sum('periodRequests') * f, errors = sum('periodErrors') * f;
      return { range: r, generatedAt: new Date().toISOString(), totals: { requests, errors, activeKeys: DKEYS.filter((k) => !k.revokedAt).length, maxKeys: 5, errorRate: requests ? errors / requests : 0 },
        series: demoSeries(r, requests), keys: DKEYS.map((k) => ({ ...k, periodRequests: k.periodRequests * f, periodErrors: k.periodErrors * f })) };
    }
    if (method === 'POST' && p === '/keys') {
      if (DKEYS.filter((k) => !k.revokedAt).length >= 5) return { __status: 409, message: 'Limite de 5 clés actives atteinte' };
      const k: DKey = { id: 'd' + Date.now(), name: 'Nouvelle clé', prefix: 'mh_live_EXEMPL', createdAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null, requests: 0, errors: 0, periodRequests: 0, periodErrors: 0 };
      DKEYS = [k, ...DKEYS];
      return { key: DEMO_KEY_NOTICE, apiKey: k, __demoId: k.id };
    }
    const del = method === 'DELETE' && p.match(/^\/keys\/(.+)$/);
    if (del) { DKEYS = DKEYS.map((k) => (k.id === del[1] ? { ...k, revokedAt: new Date().toISOString() } : k)); return { ok: true }; }
  }
  if (role !== 'admin') return undefined;
  if (method === 'GET' && p === '/admin/api-stats') {
    const r = q.get('range') ?? '24h'; const f = r === '24h' ? 1 : r === '7d' ? 7 : 30;
    return { range: r, generatedAt: new Date().toISOString(), keys: { total: 14, active: 11, revoked: 3, createdLast7d: 4, owners: 6 },
      totals: { requests: 5240 * f, errors: 61 * f, errorRate: 61 / 5240, activeConsumers: 5 }, series: demoSeries(r, 5240 * f),
      topUsers: [['utilisateur02', 2310], ['utilisateur03', 1470], ['utilisateur06', 980], ['utilisateur05', 330], ['utilisateur04', 150]].map(([username, n]) => ({ username, requests: (n as number) * f, errors: Math.round((n as number) * f * 0.011) })) };
  }
  if (method === 'GET' && p === '/admin/stats') return { total: USERS.length, active: 5, suspended: 1, admins: 1, createdLast7d: 6 };
  if (method === 'GET' && p === '/admin/users') {
    let items = USERS;
    const s = q.get('q')?.toLowerCase(); if (s) items = items.filter((u) => u.email.includes(s));
    if (q.get('role')) items = items.filter((u) => u.role === q.get('role'));
    if (q.get('status')) items = items.filter((u) => u.status === q.get('status'));
    return { items, total: items.length, page: 1, pageSize: 20 };
  }
  if (method === 'GET' && p === '/admin/audit-logs') return { items: LOGS, total: LOGS.length, page: 1, pageSize: 20 };
  if (method === 'PATCH' && p.startsWith('/admin/users/')) return { __status: 503, message: 'Aperçu : les modifications ne sont pas enregistrées.' };
  return undefined;
}
