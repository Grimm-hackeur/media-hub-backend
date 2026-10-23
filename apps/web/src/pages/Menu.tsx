import { Link } from 'react-router-dom';
import { ChevronRight, Code2, Home, LayoutGrid, Shield, User, X, type LucideIcon } from 'lucide-react';
import { TOOLS } from '../features/tools';
import { useAuth } from '../auth/AuthContext';
import { LEGAL } from './Legal';
import { cx } from '../components/ui';

export function MenuPage() {
  const { user } = useAuth();
  const items: [string, string, LucideIcon][] = [['/', 'Accueil', Home], ['/outils', 'Outils', LayoutGrid], ['/api', 'API', Code2], ['/compte', 'Compte', User]];
  if (user?.role === 'ADMIN') items.push(['/admin', 'Administration', Shield]);
  const row = 'flex h-14 items-center gap-3.5 border-b border-line px-1 text-base font-medium transition-colors hover:bg-panel';
  return (
    <div className="max-w-md">
      <div className="flex justify-end"><Link to="/" aria-label="Fermer le menu" title="Fermer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:bg-hover"><X size={18} /></Link></div>
      <nav aria-label="Menu" className="mt-2">
        {items.map(([to, label, Icon]) => (<div key={to}>
          <Link to={to} className={row}><Icon size={20} strokeWidth={1.75} /><span className="flex-1">{label}</span><ChevronRight size={16} className="text-muted" /></Link>
          {to === '/outils' && <div className="flex flex-col border-b border-line py-1 pl-[38px]">{TOOLS.map((t) => <Link key={t.id} to={`/outils/${t.id}`} className="flex h-10 items-center text-[15px] text-muted hover:text-white">{t.name}</Link>)}</div>}
        </div>))}
      </nav>
      <div className={cx('mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted')}>
        {LEGAL.slice(0, 4).map((l) => <Link key={l.slug} to={`/legal/${l.slug}`} className="inline-flex h-8 items-center hover:text-white">{l.short}</Link>)}
        <Link to="/legal" className="inline-flex h-8 items-center hover:text-white">Tout voir</Link>
      </div>
    </div>
  );
}
