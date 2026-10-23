import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';

/** Fetches `path` now and every `ms` milliseconds while the tab is visible. Keeps the last good data on a failed refresh. */
export function usePoll<T>(path: string, ms = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const id = ++seq.current;
    try {
      const d = await api<T>('GET', path);
      if (id !== seq.current) return;
      setData(d); setError(null); setUpdatedAt(new Date());
    } catch (e) {
      if (id !== seq.current) return;
      setError(e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', 'Erreur inattendue'));
    } finally { if (id === seq.current) setLoading(false); }
  }, [path]);

  useEffect(() => {
    setLoading(true); void load();
    const tick = () => { if (document.visibilityState === 'visible') void load(); };
    const t = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => { seq.current++; clearInterval(t); document.removeEventListener('visibilitychange', tick); };
  }, [load, ms]);

  return { data, error, loading, updatedAt, reload: load };
}
