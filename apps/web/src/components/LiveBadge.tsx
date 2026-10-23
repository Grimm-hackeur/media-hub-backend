import { useEffect, useState } from 'react';
import { cx } from './ui';

export function LiveBadge({ updatedAt, error }: { updatedAt: Date | null; error: boolean }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  const s = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt.getTime()) / 1000)) : null;
  return (
    <span role="status" className="inline-flex items-center gap-2 font-mono text-[11px] text-muted">
      <span className={cx('h-2 w-2 rounded-full', error ? 'bg-danger' : 'mh-pulse bg-accent')} aria-hidden />
      {error ? 'Actualisation en échec' : s === null ? 'Connexion…' : `En direct · actualisé il y a ${s} s`}
    </span>
  );
}
