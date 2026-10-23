import { useState } from 'react';
import { Activity, AlertTriangle, Check, Copy, Gauge, KeyRound, Plus, Trash2, Zap } from 'lucide-react';
import { Alert, Badge, Button, ButtonLink, Empty, Field, Modal, PageTitle, Panel, SectionLabel, Spinner } from '../components/ui';
import { LiveBadge } from '../components/LiveBadge';
import { RangeTabs, StatCard, fmt, pct } from '../components/StatCard';
import { UsageChart, type Point } from '../components/UsageChart';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../lib/api';
import { DEMO_KEY_NOTICE, isDemo } from '../lib/demo';
import { usePoll } from '../lib/usePoll';

interface KeyItem { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null; requests: number; errors: number; periodRequests: number; periodErrors: number }
interface Usage { range: string; totals: { requests: number; errors: number; activeKeys: number; maxKeys: number; errorRate: number }; series: Point[]; keys: KeyItem[] }

const ago = (iso: string | null) => {
  if (!iso) return 'Jamais';
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return 'À l’instant';
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`;
  return `Il y a ${Math.floor(s / 86400)} j`;
};

export function ApiPage() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Dashboard verified={user.emailVerified} /> : <Intro />;
}

function Intro() {
  const rows = [{ icon: KeyRound, title: 'Clés API', text: 'Créez jusqu’à 5 clés et révoquez-les à tout moment.' }, { icon: Activity, title: 'Statistiques en direct', text: 'Requêtes, erreurs et dernière utilisation par clé.' }, { icon: Gauge, title: 'Limites claires', text: '60 requêtes par minute et par clé.' }];
  return (
    <div className="max-w-xl">
      <PageTitle title="API" sub="Utilisez Media Hub depuis vos propres applications." />
      <div className="mt-8 divide-y divide-line overflow-hidden rounded-lg border border-line">
        {rows.map((r) => (
          <div key={r.title} className="flex min-h-16 items-center gap-3.5 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line"><r.icon size={20} strokeWidth={1.75} /></span>
            <span className="leading-snug"><span className="block text-[15px] font-medium">{r.title}</span><span className="block text-[13px] text-muted">{r.text}</span></span>
          </div>))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3"><ButtonLink to="/connexion" variant="primary">Se connecter</ButtonLink><ButtonLink to="/inscription">Créer un compte</ButtonLink></div>
      <p className="mt-6 text-[13px] text-muted">Une clé API est liée à un compte. Les routes de téléchargement seront ouvertes quand les fournisseurs seront connectés.</p>
    </div>
  );
}

function Dashboard({ verified }: { verified: boolean }) {
  const [range, setRange] = useState('24h');
  const { data, error, loading, updatedAt, reload } = usePoll<Usage>(`/keys/usage?range=${range}`, 5000);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<KeyItem | null>(null);

  const atLimit = !!data && data.totals.activeKeys >= data.totals.maxKeys;
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageTitle title="API" sub="Vos clés et leur utilisation." actions={
        <Button variant="primary" onClick={() => setCreating(true)} disabled={!verified || atLimit} title={!verified ? 'Confirmez votre e-mail' : atLimit ? 'Limite atteinte' : undefined}><Plus size={16} />Nouvelle clé</Button>} />
      {isDemo && <p className="w-fit rounded border border-dashed border-line-strong px-2 py-0.5 font-mono text-[11px] text-muted">APERÇU · DONNÉES D’EXEMPLE · LES CLÉS CRÉÉES ICI SONT FACTICES</p>}
      {!verified && <Alert kind="info" title="Confirmez votre adresse e-mail">La création de clés est réservée aux comptes vérifiés.</Alert>}
      {loading && !data ? <Spinner /> : error && !data ? <Alert title="Impossible de charger l’utilisation" action={<Button size="sm" onClick={() => void reload()}>Réessayer</Button>}>{error.message}</Alert> : data && (<>
        <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
          <StatCard label="Requêtes" value={fmt(data.totals.requests)} icon={Zap} hint={range === '24h' ? '24 dernières heures' : range === '7d' ? '7 derniers jours' : '30 derniers jours'} />
          <StatCard label="Erreurs" value={fmt(data.totals.errors)} icon={AlertTriangle} hint={`Taux ${pct(data.totals.errorRate)}`} />
          <StatCard label="Clés actives" value={`${data.totals.activeKeys} / ${data.totals.maxKeys}`} icon={KeyRound} />
          <StatCard label="Limite" value="60 / min" icon={Gauge} hint="Par clé" />
        </div>
        <Panel className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-[15px] font-semibold">Utilisation</h2><RangeTabs value={range} onChange={setRange} /></div>
          <UsageChart points={data.series} range={range} />
          <div className="mt-3"><LiveBadge updatedAt={updatedAt} error={!!error} /></div>
        </Panel>
        <section aria-label="Clés API" className="flex flex-col gap-3">
          <SectionLabel>Vos clés</SectionLabel>
          {data.keys.length === 0 ? <Empty icon={<KeyRound size={20} />} title="Aucune clé" text="Créez votre première clé pour appeler l’API." /> : (
            <ul className="divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-panel">
              {data.keys.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3.5">
                  <div className="min-w-0 flex-1 basis-48"><p className="flex items-center gap-2 font-medium"><span className="truncate">{k.name}</span>{k.revokedAt && <Badge tone="danger">Révoquée</Badge>}</p>
                    <p className="font-mono text-xs text-muted">{k.prefix}…</p></div>
                  <dl className="grid grid-cols-3 gap-5 text-[13px]">
                    <div><dt className="text-muted">Requêtes</dt><dd className="tabular-nums">{fmt(k.periodRequests)}</dd></div>
                    <div><dt className="text-muted">Erreurs</dt><dd className="tabular-nums">{fmt(k.periodErrors)}</dd></div>
                    <div><dt className="text-muted">Utilisée</dt><dd className="whitespace-nowrap">{ago(k.lastUsedAt)}</dd></div>
                  </dl>
                  {!k.revokedAt && <Button size="sm" variant="danger" onClick={() => setRevoking(k)} aria-label={`Révoquer ${k.name}`}><Trash2 size={14} />Révoquer</Button>}
                </li>))}
            </ul>)}
        </section>
        <Panel className="p-4 sm:p-5">
          <h2 className="text-[15px] font-semibold">Utiliser une clé</h2>
          <p className="mt-1 text-[13px] text-muted">Envoyez la clé dans l’en-tête <code className="font-mono text-soft">X-API-Key</code>. Pour l’instant, une seule route existe : elle vérifie la clé et compte comme une requête.</p>
          <pre className="mt-3 overflow-x-auto rounded-md border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-soft"><code>{`curl -H "X-API-Key: $MEDIA_HUB_KEY" \\\n  https://VOTRE-DOMAINE/api/v1/status`}</code></pre>
          <p className="mt-3 text-[13px] text-muted">Gardez la clé côté serveur : ne la placez jamais dans une application mobile ou une page web publique.</p>
        </Panel>
      </>)}
      {creating && <CreateKey onClose={() => setCreating(false)} onCreated={(k) => { setCreating(false); setCreated(k); void reload(); }} />}
      {created && <KeyReveal value={created} onClose={() => setCreated(null)} />}
      {revoking && <Revoke k={revoking} onClose={() => setRevoking(null)} onDone={() => { setRevoking(null); void reload(); }} />}
    </div>
  );
}

function CreateKey({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr('Donnez un nom à la clé.'); return; }
    setBusy(true); setErr(null);
    try { const r = await api<{ key: string }>('POST', '/keys', { name: name.trim() }); onCreated(r.key); }
    catch (x) { setErr(x instanceof ApiError ? x.message : 'Erreur'); setBusy(false); }
  }
  return (
    <Modal title="Nouvelle clé API" onClose={onClose}>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-4" noValidate>
        <Field label="Nom" placeholder="Ex. Application mobile" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoFocus hint="Pour reconnaître la clé dans la liste." />
        {err && <Alert title="Création impossible">{err}</Alert>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" variant="primary" loading={busy}>Créer la clé</Button></div>
      </form>
    </Modal>
  );
}

function KeyReveal({ value, onClose }: { value: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(value); setCopied(true); } catch { setCopied(false); } }
  return (
    <Modal title="Clé créée" onClose={onClose}>
      <div className="mt-3 flex flex-col gap-3">
        <Alert kind="info" title="Copiez-la maintenant">Cette clé ne sera plus jamais affichée. Seule une empreinte est conservée.</Alert>
        {isDemo && value === DEMO_KEY_NOTICE && <p className="text-[13px] text-danger">Aperçu : clé factice, elle ne fonctionne pas.</p>}
        <code className="select-all break-all rounded-md border border-line bg-bg p-3 font-mono text-xs">{value}</code>
        <div className="flex justify-end gap-2"><Button onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copiée' : 'Copier'}</Button><Button variant="primary" onClick={onClose}>J’ai copié la clé</Button></div>
      </div>
    </Modal>
  );
}

function Revoke({ k, onClose, onDone }: { k: KeyItem; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  async function go() { setBusy(true); try { await api('DELETE', `/keys/${k.id}`); onDone(); } catch (x) { setErr(x instanceof ApiError ? x.message : 'Erreur'); setBusy(false); } }
  return (
    <Modal title={`Révoquer « ${k.name} » ?`} onClose={onClose}>
      <p className="mt-2 text-sm text-muted">Les applications qui utilisent cette clé recevront une erreur 401 immédiatement. Action irréversible.</p>
      {err && <div className="mt-3"><Alert title="Échec">{err}</Alert></div>}
      <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="danger" loading={busy} onClick={go}>Révoquer la clé</Button></div>
    </Modal>
  );
}
