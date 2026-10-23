import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, KeyRound, Plug, Search, Users as UsersIcon, UserX, ShieldCheck, UserPlus, MoreVertical, Zap } from 'lucide-react';
import { LiveBadge } from '../../components/LiveBadge';
import { RangeTabs, StatCard, fmt, pct } from '../../components/StatCard';
import { UsageChart, type Point } from '../../components/UsageChart';
import { usePoll } from '../../lib/usePoll';
import { Alert, Badge, Button, Empty, Field, Modal, PageTitle, Panel, SectionLabel, Spinner, cx } from '../../components/ui';
import { api, ApiError, type Paged, type User } from '../../lib/api';
import { isDemo } from '../../lib/demo';
import { useFetch } from '../../lib/useFetch';

const dt = (s: string | null) => (s ? new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const Demo = () => isDemo ? <span className="rounded border border-dashed border-line-strong px-2 py-0.5 font-mono text-[11px] text-muted">APERÇU · DONNÉES D’EXEMPLE</span> : null;

function Async<T>({ r, children }: { r: ReturnType<typeof useFetch<T>>; children: (d: T) => React.ReactNode }) {
  if (r.loading) return <Spinner />;
  if (r.error) return <Alert title={r.error.status === 403 ? 'Accès refusé' : 'Impossible de charger les données'} action={<Button size="sm" onClick={r.reload}>Réessayer</Button>}>{r.error.message}</Alert>;
  return <>{children(r.data as T)}</>;
}

const Stat = ({ label, value, icon: Icon, hint }: { label: string; value: number; icon: typeof UsersIcon; hint?: string }) => (
  <Panel className="p-5"><div className="flex items-center justify-between text-[13px] text-muted">{label}<Icon size={16} /></div>
    <div className="mt-2.5 text-3xl font-semibold leading-none tracking-[-0.03em] tabular-nums">{value.toLocaleString('fr-FR')}</div>{hint && <div className="mt-1.5 text-xs text-muted">{hint}</div>}</Panel>
);

export function Overview() {
  const stats = useFetch<{ total: number; active: number; suspended: number; admins: number; createdLast7d: number }>('/admin/stats');
  const logs = useFetch<Paged<AuditItem>>('/admin/audit-logs?pageSize=6');
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Vue d’ensemble" sub="Comptes et activité de la plateforme." actions={<Demo />} />
      <Async r={stats}>{(s) => (
        <div className="grid grid-cols-2 gap-3 min-[1100px]:grid-cols-4 min-[1100px]:gap-4">
          <Stat label="Utilisateurs" value={s.total} icon={UsersIcon} hint={`${s.active} actifs`} /><Stat label="Nouveaux (7 j)" value={s.createdLast7d} icon={UserPlus} />
          <Stat label="Suspendus" value={s.suspended} icon={UserX} /><Stat label="Administrateurs" value={s.admins} icon={ShieldCheck} /></div>)}</Async>
      <div className="grid grid-cols-1 gap-4 min-[1100px]:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <Panel className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-[15px] font-semibold">Activité récente</h2><Link to="/admin/journaux" className="text-[13px] text-soft hover:text-white">Tout voir</Link></div>
          <Async r={logs}>{(l) => l.items.length === 0 ? <Empty icon={<ShieldCheck size={20} />} title="Aucune activité" /> : <ul>{l.items.map((a) => <li key={a.id} className="flex items-center justify-between gap-3 border-t border-line py-3 text-sm first:border-t-0"><span className="min-w-0 truncate font-mono text-xs">{a.action}</span><span className="shrink-0 whitespace-nowrap text-muted">{dt(a.timestamp)}</span></li>)}</ul>}</Async></Panel>
        <Panel className="p-5"><h2 className="mb-3 text-[15px] font-semibold">Services</h2>
          <Empty icon={<Plug size={20} />} title="0 service connecté sur 5" text="TikTok, Instagram, Facebook, Google Play et Musique attendent leur intégration." />
          <Link to="/admin/services" className="mt-3 inline-block text-[13px] text-soft hover:text-white">Voir les services</Link></Panel>
      </div>
    </div>
  );
}

function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (p: number) => void }) {
  const last = Math.max(1, Math.ceil(total / size));
  return (<div className="mt-4 flex items-center justify-between text-[13px] text-muted"><span>{total === 0 ? '0 résultat' : `${(page - 1) * size + 1} – ${Math.min(page * size, total)} sur ${total}`}</span>
    <span className="flex gap-2"><Button size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Précédent</Button><Button size="sm" disabled={page >= last} onClick={() => onPage(page + 1)}>Suivant</Button></span></div>);
}
const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) => (
  <label className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-bg px-3 text-[13px] text-soft">{label}
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="bg-transparent text-white outline-none">{options.map(([v, l]) => <option key={v} value={v} className="bg-panel">{l}</option>)}</select></label>
);

export function UsersPage() {
  const [q, setQ] = useState(''); const [role, setRole] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const [target, setTarget] = useState<User | null>(null);
  const qs = new URLSearchParams({ page: String(page), pageSize: '20', ...(q ? { q } : {}), ...(role ? { role } : {}), ...(status ? { status } : {}) });
  const r = useFetch<Paged<User>>(`/admin/users?${qs}`);
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Utilisateurs" sub="Comptes, rôles et statuts." actions={<Demo />} />
      <div className="flex flex-wrap gap-2">
        <div className="w-full sm:w-80"><Field label="Rechercher" aria-label="Rechercher un e-mail ou un nom" placeholder="E-mail ou nom" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} leading={<Search size={16} className="text-muted" />} className="[&>label]:sr-only [&>div]:h-10" /></div>
        <Select label="Rôle" value={role} onChange={(v) => { setRole(v); setPage(1); }} options={[['', 'Tous'], ['USER', 'Utilisateur'], ['ADMIN', 'Admin']]} />
        <Select label="Statut" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[['', 'Tous'], ['ACTIVE', 'Actif'], ['SUSPENDED', 'Suspendu']]} />
      </div>
      <Async r={r}>{(d) => (<>
        {d.items.length === 0 ? <Empty icon={<UsersIcon size={20} />} title="Aucun utilisateur" text="Modifiez la recherche ou les filtres." /> : (
          <div className="overflow-x-auto rounded-[10px] border border-line bg-panel"><table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#0f0f0f] font-mono text-[11px] uppercase tracking-[0.06em] text-muted"><tr>{['Utilisateur', 'Rôle', 'Statut', 'Dernière connexion', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{d.items.map((u) => (<tr key={u.id} className="border-t border-line transition-colors hover:bg-hover">
              <td className="px-5 py-3"><div className="font-medium">{u.email}</div><div className="text-xs text-muted">{u.username}{!u.emailVerified && ' · e-mail non confirmé'}</div></td>
              <td className="px-5 py-3"><Badge tone={u.role === 'ADMIN' ? 'accent' : 'neutral'}>{u.role === 'ADMIN' ? 'Admin' : 'Utilisateur'}</Badge></td>
              <td className="px-5 py-3"><span className="inline-flex items-center gap-2"><span className={cx('h-2 w-2 rounded-full', u.status === 'ACTIVE' ? 'bg-white' : 'border border-[#6b6b6b]')} />{u.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}</span></td>
              <td className="px-5 py-3 text-muted">{dt(u.lastLoginAt)}</td>
              <td className="px-3 py-3 text-right"><button type="button" onClick={() => setTarget(u)} aria-label={`Actions pour ${u.email}`} title="Actions" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-soft hover:bg-hover hover:text-white"><MoreVertical size={16} /></button></td></tr>))}</tbody></table></div>)}
        <Pager page={d.page} size={d.pageSize} total={d.total} onPage={setPage} /></>)}</Async>
      {target && <UserActions user={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); r.reload(); }} />}
    </div>
  );
}

function UserActions({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const acts = [
    user.status === 'SUSPENDED' ? { label: 'Réactiver le compte', body: { status: 'ACTIVE' } } : { label: 'Suspendre le compte', body: { status: 'SUSPENDED' }, danger: true },
    user.role === 'ADMIN' ? { label: 'Retirer le rôle admin', body: { role: 'USER' }, danger: true } : { label: 'Promouvoir administrateur', body: { role: 'ADMIN' } },
  ];
  async function run(body: object) { setBusy(true); setErr(null); try { await api('PATCH', `/admin/users/${user.id}`, body); onDone(); } catch (e) { setErr(e instanceof ApiError ? e.message : 'Erreur'); setBusy(false); } }
  return (
    <Modal title={user.email} onClose={onClose}>
      <p className="mt-1 text-sm text-muted">Chaque action est enregistrée dans le journal d’audit.</p>
      <div className="mt-4 flex flex-col gap-2">{err && <Alert title="Action refusée">{err}</Alert>}
        {acts.map((a) => <Button key={a.label} variant={a.danger ? 'danger' : 'outline'} disabled={busy} onClick={() => run(a.body)} className="justify-start">{a.label}</Button>)}
        <Button variant="ghost" onClick={onClose} className="mt-1">Annuler</Button></div>
    </Modal>
  );
}

export function RolesPage() {
  const rows: [string, boolean, boolean][] = [['Utiliser les outils publics', true, true], ['Gérer son propre compte', true, true], ['Voir le tableau de bord', false, true], ['Lister et rechercher les utilisateurs', false, true], ['Changer le rôle ou suspendre un compte', false, true], ['Consulter le journal d’audit', false, true]];
  const Tick = ({ on }: { on: boolean }) => <span className={cx('inline-flex h-5 w-5 items-center justify-center rounded text-xs', on ? 'bg-accent text-white' : 'border border-[#303030] text-transparent')}>✓</span>;
  return (
    <div className="flex flex-col gap-6"><PageTitle title="Rôles et permissions" sub="Qui peut faire quoi." />
      <div className="overflow-x-auto rounded-[10px] border border-line bg-panel"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-[#0f0f0f] font-mono text-[11px] uppercase tracking-[0.06em] text-muted"><tr><th className="px-5 py-3 font-medium">Permission</th><th className="px-5 py-3 font-medium">Utilisateur</th><th className="px-5 py-3 font-medium">Admin</th></tr></thead>
        <tbody>{rows.map(([p, u, a]) => <tr key={p} className="border-t border-line"><td className="px-5 py-3">{p}</td><td className="px-5 py-3"><Tick on={u} /></td><td className="px-5 py-3"><Tick on={a} /></td></tr>)}</tbody></table></div>
      <p className="max-w-xl text-[13px] text-muted">Ce tableau reflète les règles appliquées par l’API : chaque permission est vérifiée côté serveur à chaque requête. Deux rôles existent aujourd’hui. Le dernier administrateur actif ne peut être ni rétrogradé, ni suspendu, ni supprimé. Des rôles personnalisés pourront être ajoutés plus tard.</p></div>
  );
}

const SERVICES = [['TikTok', 'Téléchargement de vidéos publiques'], ['Instagram', 'Reels et posts publics'], ['Facebook', 'Vidéos publiques'], ['Google Play', 'Informations d’applications'], ['Musique', 'Source à définir']];
export function ServicesPage() {
  return (
    <div className="flex flex-col gap-6"><PageTitle title="Services externes" sub="Un module indépendant par fournisseur." />
      <div className="divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-panel">
        {SERVICES.map(([n, d]) => (<div key={n} className="flex min-h-16 flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3"><div className="min-w-40 flex-1"><p className="font-medium">{n}</p><p className="text-xs text-muted">{d}</p></div>
          <span className="inline-flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full border border-[#6b6b6b]" />Non configuré</span><Badge>À intégrer</Badge></div>))}</div>
      <p className="max-w-xl text-[13px] text-muted">Aucune API n’est branchée pour le moment. Un service ne passera à « Opérationnel » qu’après l’enregistrement de sa clé côté serveur et la réussite d’un test réel. Les clés ne sont jamais renvoyées au navigateur.</p></div>
  );
}

interface AuditItem { id: string; actorId: string | null; action: string; targetId: string | null; timestamp: string }
const ACTIONS = ['', 'LOGIN', 'LOGIN_FAILED', 'REGISTER', 'EMAIL_VERIFIED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_DONE', 'ADMIN_ROLE_CHANGED', 'ADMIN_STATUS_CHANGED', 'ACCOUNT_DELETED'];
export function LogsPage() {
  const [action, setAction] = useState(''); const [page, setPage] = useState(1);
  const r = useFetch<Paged<AuditItem>>(`/admin/audit-logs?page=${page}&pageSize=20${action ? `&action=${action}` : ''}`);
  return (
    <div className="flex flex-col gap-6"><PageTitle title="Journaux d’activité" sub="Événements de sécurité et d’administration." actions={<Demo />} />
      <div><Select label="Action" value={action} onChange={(v) => { setAction(v); setPage(1); }} options={ACTIONS.map((a) => [a, a || 'Toutes'])} /></div>
      <Async r={r}>{(d) => (<>{d.items.length === 0 ? <Empty icon={<ShieldCheck size={20} />} title="Aucun événement" /> : (
        <div className="overflow-x-auto rounded-[10px] border border-line bg-panel"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-[#0f0f0f] font-mono text-[11px] uppercase tracking-[0.06em] text-muted"><tr>{['Date', 'Action', 'Acteur', 'Cible'].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{d.items.map((a) => <tr key={a.id} className="border-t border-line hover:bg-hover"><td className="whitespace-nowrap px-5 py-3 text-muted">{dt(a.timestamp)}</td><td className="px-5 py-3 font-mono text-xs">{a.action}</td><td className="px-5 py-3 font-mono text-xs text-muted">{a.actorId ? a.actorId.slice(-6) : 'système'}</td><td className="px-5 py-3 font-mono text-xs text-muted">{a.targetId ? a.targetId.slice(-6) : '—'}</td></tr>)}</tbody></table></div>)}
        <Pager page={d.page} size={d.pageSize} total={d.total} onPage={setPage} /></>)}</Async>
      <p className="text-xs text-muted">Les journaux ne contiennent ni mot de passe, ni jeton, ni adresse e-mail.</p></div>
  );
}

interface ApiStats { range: string; keys: { total: number; active: number; revoked: number; createdLast7d: number; owners: number }; totals: { requests: number; errors: number; errorRate: number; activeConsumers: number }; series: Point[]; topUsers: { username: string; requests: number; errors: number }[] }
export function ApiStatsPage() {
  const [range, setRange] = useState('24h');
  const { data, error, loading, updatedAt, reload } = usePoll<ApiStats>(`/admin/api-stats?range=${range}`, 5000);
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="API et clés" sub="Clés créées et consommation de l’API publique." actions={<Demo />} />
      {loading && !data ? <Spinner /> : error && !data ? <Alert title={error.status === 403 ? 'Accès refusé' : 'Impossible de charger les statistiques'} action={<Button size="sm" onClick={() => void reload()}>Réessayer</Button>}>{error.message}</Alert> : data && (<>
        <div className="grid grid-cols-2 gap-3 min-[1100px]:grid-cols-4 min-[1100px]:gap-4">
          <StatCard label="Clés créées" value={fmt(data.keys.total)} icon={KeyRound} hint={`${data.keys.createdLast7d} sur 7 jours`} />
          <StatCard label="Clés actives" value={fmt(data.keys.active)} icon={Activity} hint={`${data.keys.revoked} révoquées`} />
          <StatCard label="Requêtes" value={fmt(data.totals.requests)} icon={Zap} hint={`${data.totals.activeConsumers} consommateurs`} />
          <StatCard label="Taux d’erreur" value={pct(data.totals.errorRate)} icon={AlertTriangle} hint={`${fmt(data.totals.errors)} erreurs`} />
        </div>
        <div className="grid grid-cols-1 gap-4 min-[1100px]:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
          <Panel className="p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-[15px] font-semibold">Requêtes</h2><RangeTabs value={range} onChange={setRange} /></div>
            <UsageChart points={data.series} range={range} /><div className="mt-3"><LiveBadge updatedAt={updatedAt} error={!!error} /></div></Panel>
          <Panel className="p-5"><h2 className="mb-3 text-[15px] font-semibold">Plus gros consommateurs</h2>
            {data.topUsers.length === 0 ? <Empty icon={<Activity size={20} />} title="Aucune requête sur la période" /> : (
              <ol>{data.topUsers.map((u, i) => (<li key={u.username} className="flex items-center gap-3 border-t border-line py-3 text-sm first:border-t-0">
                <span className="w-4 font-mono text-xs text-muted">{i + 1}</span><span className="min-w-0 flex-1 truncate">{u.username}</span>
                <span className="tabular-nums">{fmt(u.requests)}</span></li>))}</ol>)}</Panel>
        </div>
        <p className="max-w-xl text-[13px] text-muted">Les compteurs sont agrégés par heure. Les clés elles-mêmes ne sont jamais visibles : seule une empreinte est stockée.</p></>)}
    </div>
  );
}
