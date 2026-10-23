import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Code2, Home, LayoutGrid, Menu, User as UserIcon, type LucideIcon } from 'lucide-react';
import { Logo } from '../components/Logo';
import { ButtonLink, cx } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { DemoSwitch } from '../components/DemoSwitch';
import { LEGAL } from '../pages/Legal';

const TABS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/outils', label: 'Outils', icon: LayoutGrid },
  { to: '/api', label: 'API', icon: Code2 },
  { to: '/compte', label: 'Compte', icon: UserIcon },
];

export function PublicLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const brand = (
    <Link to="/" aria-label="Media Hub, accueil" className="flex items-center gap-2.5 text-white"><Logo /><span className="text-base font-semibold tracking-[-0.02em]">Media Hub</span></Link>
  );
  return (
    <div className="flex min-h-full flex-col bg-bg text-white">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:h-16 md:px-8">
          {brand}
          <nav aria-label="Navigation" className="hidden items-center gap-1 md:flex">
            {TABS.slice(1, 3).map((t) => (
              <NavLink key={t.to} to={t.to} className={({ isActive }) => cx('rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-white', isActive ? 'text-white' : 'text-muted')}>{t.label}</NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? <ButtonLink to={user.role === 'ADMIN' ? '/admin' : '/compte'} size="sm">{user.role === 'ADMIN' ? 'Administration' : 'Mon compte'}</ButtonLink>
              : <><ButtonLink to="/connexion" variant="ghost" size="sm">Connexion</ButtonLink><ButtonLink to="/inscription" variant="primary" size="sm">Créer un compte</ButtonLink></>}
          </div>
          <Link to="/menu" aria-label="Ouvrir le menu" title="Menu" className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-white transition-colors hover:bg-hover md:hidden"><Menu size={18} /></Link>
        </div>
      </header>

      <main key={pathname} className="mh-fade mx-auto w-full max-w-6xl flex-1 px-5 pb-[calc(88px+env(safe-area-inset-bottom))] pt-7 md:px-8 md:pb-16 md:pt-12"><Outlet /></main>

      <footer className="hidden border-t border-line md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-8 py-6 text-[13px] text-muted">
          <span>© 2026 Media Hub</span>
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-1">
            {LEGAL.slice(0, 4).map((l) => <Link key={l.slug} to={`/legal/${l.slug}`} className="hover:text-white">{l.short}</Link>)}
            <Link to="/legal" className="hover:text-white">Toutes les pages légales</Link>
          </nav>
        </div>
      </footer>

      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-bg/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cx('relative flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors', isActive ? 'text-white' : 'text-muted hover:text-white')}>
            {({ isActive }) => (<>{isActive && <span className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 bg-accent" />}<t.icon size={22} strokeWidth={1.75} className={isActive ? 'text-accent' : ''} aria-hidden />{t.label}</>)}
          </NavLink>
        ))}
      </nav>
      <DemoSwitch />
    </div>
  );
}
