import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, KeyRound, LayoutDashboard, LogOut, Plug, Settings, ShieldCheck, User as UserIcon, Users, type LucideIcon } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Alert, ButtonLink, cx, Spinner } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { DemoSwitch } from '../components/DemoSwitch';

const KEY = 'mh.admin.sidebar';
const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/admin/roles', label: 'Rôles et permissions', icon: ShieldCheck },
  { to: '/admin/api', label: 'API et clés', icon: KeyRound },
  { to: '/admin/services', label: 'Services externes', icon: Plug },
  { to: '/admin/journaux', label: 'Journaux', icon: FileText },
];
const SOON: { label: string; icon: LucideIcon }[] = [{ label: 'Configuration', icon: Settings }, { label: 'Profil administrateur', icon: UserIcon }];

function readOpen(): boolean {
  try { const v = localStorage.getItem(KEY); if (v !== null) return v === '1'; } catch { /* storage unavailable */ }
  return typeof window !== 'undefined' && window.innerWidth >= 900;
}

/** UI guard only. The API enforces the real authorisation on every admin route. */
export function RequireAdmin() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-6"><Spinner /></div>;
  if (!user) return <Navigate to="/connexion" state={{ from: loc.pathname }} replace />;
  if (user.role !== 'ADMIN') return <div className="mx-auto max-w-md p-6 pt-16"><Alert title="Accès refusé" action={<ButtonLink to="/" size="sm">Retour au site</ButtonLink>}>Cet espace est réservé aux administrateurs.</Alert></div>;
  return <AdminLayout />;
}

function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(readOpen);
  const { pathname } = useLocation();
  useEffect(() => { try { localStorage.setItem(KEY, open ? '1' : '0'); } catch { /* ignore */ } }, [open]);
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? 'Administration';
  const label = (t: string) => <span className={cx('whitespace-nowrap transition-opacity duration-150', open ? 'opacity-100' : 'pointer-events-none opacity-0')}>{t}</span>;
  const item = 'group relative flex h-10 items-center gap-3 rounded-lg border border-transparent px-[11px] text-sm font-medium transition-colors';
  const tip = (t: string) => !open && <span role="tooltip" className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-black shadow-lg group-hover:block group-focus-visible:block">{t}</span>;

  return (
    <div className="min-h-full bg-bg text-white">
      <aside aria-label="Navigation administration" className={cx('fixed inset-y-0 left-0 z-40 flex flex-col gap-1 border-r border-line bg-bg p-3 transition-[width,box-shadow] duration-200', open ? 'w-60 shadow-[16px_0_48px_rgba(0,0,0,.6)] min-[900px]:shadow-[8px_0_32px_rgba(0,0,0,.35)]' : 'w-16')}>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Réduire le menu' : 'Développer le menu'} title={open ? 'Réduire le menu' : 'Développer le menu'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-panel transition-colors hover:border-line-strong hover:bg-hover">{open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>
        <Link to="/admin" className="mt-1.5 flex h-10 items-center gap-2.5 px-1.5" aria-label="Administration Media Hub"><Logo />
          <span className={cx('flex items-baseline gap-2 whitespace-nowrap transition-opacity', open ? 'opacity-100' : 'pointer-events-none opacity-0')}><b className="text-base font-semibold tracking-[-0.02em]">Media Hub</b><span className="font-mono text-[11px] text-accent">ADMIN</span></span></Link>
        <div className="my-2 h-px bg-line" />
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} aria-label={n.label} className={({ isActive }) => cx(item, isActive ? 'border-[#303030] bg-panel text-white' : 'text-soft hover:border-line hover:bg-panel hover:text-white')}>
              {({ isActive }) => (<>{isActive && <span className="absolute -left-3 bottom-2.5 top-2.5 w-0.5 rounded bg-accent" />}<n.icon size={20} strokeWidth={1.75} className={cx('shrink-0', isActive && 'text-accent')} />{label(n.label)}{tip(n.label)}</>)}
            </NavLink>))}
          {SOON.map((n) => (<span key={n.label} aria-disabled="true" className={cx(item, 'cursor-not-allowed text-soft opacity-50')} title="Prévu"><n.icon size={20} strokeWidth={1.75} className="shrink-0" />{label(n.label)}</span>))}
        </nav>
        <div className="mt-auto"><div className="my-2 h-px bg-line" />
          <button type="button" onClick={() => void logout()} aria-label="Se déconnecter" className={cx(item, 'w-full cursor-pointer text-soft hover:border-line hover:bg-panel hover:text-white')}><LogOut size={20} strokeWidth={1.75} className="shrink-0" />{label('Se déconnecter')}{tip('Se déconnecter')}</button></div>
      </aside>
      {open && <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/50 min-[900px]:hidden" />}

      <div className={cx('min-h-full pl-16 transition-[padding] duration-200', open && 'min-[900px]:pl-60')}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/90 px-5 backdrop-blur min-[900px]:px-8">
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.06em] text-muted">Administration / {current}</p>
          <div className="flex items-center gap-3"><Link to="/" className="hidden text-[13px] text-muted hover:text-white sm:block">Voir le site</Link>
            <span title={user?.email} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#303030] bg-panel text-soft"><UserIcon size={16} /></span></div>
        </header>
        <main className="mh-fade px-5 py-7 min-[900px]:px-8" key={pathname}><Outlet /></main>
      </div>
      <DemoSwitch />
    </div>
  );
}
