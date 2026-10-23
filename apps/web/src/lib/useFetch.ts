import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api';

export function useFetch<T>(path: string) {
  const [state, set] = useState<{ data: T | null; error: ApiError | null; loading: boolean }>({ data: null, error: null, loading: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    set((s) => ({ ...s, loading: true, error: null }));
    api<T>('GET', path).then(
      (data) => live && set({ data, error: null, loading: false }),
      (e) => live && set({ data: null, error: e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', 'Erreur inattendue'), loading: false }),
    );
    return () => { live = false; };
  }, [path, n]);
  return { ...state, reload: useCallback(() => setN((x) => x + 1), []) };
}
