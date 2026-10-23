import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, setCsrf, type User } from '../lib/api';
import { isDemo, useDemoRole } from '../lib/demo';

interface AuthState {
  user: User | null; loading: boolean;
  /** Resolves with the challenge when a second factor is required (no session yet). */
  login(email: string, password: string): Promise<{ twoFactorRequired: true; challenge: string } | { twoFactorRequired: false }>;
  loginTwoFactor(challenge: string, code: string): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  /** Installs a session returned by the server (e.g. after a verified OTP). */
  applySession(user: User, csrfToken: string): void;
}
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const demoRole = useDemoRole();

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ user: User; csrfToken: string }>('GET', '/auth/me');
      setCsrf(r.csrfToken); setUser(r.user);
    } catch (e) {
      setCsrf(null); setUser(null);
      if (!(e instanceof ApiError)) throw e;
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh, isDemo ? demoRole : null]);

  const value = useMemo<AuthState>(() => ({
    user, loading, refresh,
    applySession(u, c) { setCsrf(c); setUser(u); },
    async login(email, password) {
      const r = await api<{ user: User; csrfToken: string } | { twoFactorRequired: true; challenge: string }>('POST', '/auth/login', { email, password });
      if ('twoFactorRequired' in r) return { twoFactorRequired: true, challenge: r.challenge };
      setCsrf(r.csrfToken); setUser(r.user);
      return { twoFactorRequired: false };
    },
    async loginTwoFactor(challenge, code) {
      const r = await api<{ user: User; csrfToken: string }>('POST', '/auth/login/2fa', { challenge, code });
      setCsrf(r.csrfToken); setUser(r.user);
    },
    async logout() { try { await api('POST', '/auth/logout'); } finally { setCsrf(null); setUser(null); } },
  }), [user, loading, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
