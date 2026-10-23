import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Code2, Copy, History, KeyRound, LogOut, Settings, Shield, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Alert, Badge, Button, ButtonLink, Field, Modal, PageTitle } from '../components/ui';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { isDemo, DEMO_2FA_CODE } from '../lib/demo';

export function AccountPage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!user) {
    return (
      <div className="max-w-sm"><PageTitle title="Compte" sub="Connectez-vous pour retrouver votre historique." />
        <div className="mt-8 flex flex-col gap-3"><ButtonLink to="/connexion" variant="primary" size="lg">Se connecter</ButtonLink><ButtonLink to="/inscription" size="lg">Créer un compte</ButtonLink></div></div>
    );
  }
  const rows: [string, string, typeof History, boolean][] = [['Historique', 'Vos téléchargements récents', History, false], ['Clés API', 'Prévu', Code2, false], ['Réglages', 'Prévu', Settings, false]];
  return (
    <div className="max-w-xl">
      <PageTitle title="Compte" />
      <div className="mt-6 flex items-center gap-4 rounded-lg border border-line bg-panel p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line"><UserIcon size={22} /></span>
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{user.username}</p><p className="truncate text-[13px] text-muted">{user.email}</p></div>
        {user.role === 'ADMIN' && <Badge tone="accent">Admin</Badge>}
      </div>
      {!user.emailVerified && <div className="mt-4"><Alert title="Adresse non confirmée" action={<Button size="sm" onClick={() => api('POST', '/auth/resend-verification').catch(() => {})}>Renvoyer l’e-mail</Button>}>Confirmez votre adresse pour débloquer toutes les fonctions.</Alert></div>}
      <div className="mt-6 divide-y divide-line overflow-hidden rounded-lg border border-line">
        {user.role === 'ADMIN' && <Link to="/admin" className="flex h-14 items-center gap-3.5 px-4 hover:bg-panel"><Shield size={20} strokeWidth={1.75} /><span className="flex-1 text-[15px] font-medium">Administration</span><ChevronRight size={16} className="text-muted" /></Link>}
        {rows.map(([t, s, Icon]) => (<div key={t} className="flex h-14 items-center gap-3.5 px-4 opacity-80"><Icon size={20} strokeWidth={1.75} /><span className="flex-1 leading-snug"><span className="block text-[15px] font-medium">{t}</span></span><span className="text-xs text-muted">{s === 'Prévu' ? 'Prévu' : ''}</span></div>))}
      </div>
      <TwoFactorCard />
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={async () => { await logout(); nav('/'); }}><LogOut size={16} />Se déconnecter</Button>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>Supprimer mon compte</Button>
      </div>
      {confirmDelete && <DeleteDialog onClose={() => setConfirmDelete(false)} onDone={async () => { await logout().catch(() => {}); nav('/'); }} />}
    </div>
  );
}

function DeleteDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  return (
    <Modal title="Supprimer mon compte" onClose={onClose}>
      <p className="mt-2 text-sm text-muted">Cette action est définitive. Vos sessions sont fermées et vos données personnelles sont effacées. Confirmez avec votre mot de passe.</p>
      <form className="mt-4 flex flex-col gap-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { await api('DELETE', '/auth/account', { password: pw }); onDone(); } catch (x) { setErr(x instanceof ApiError ? x.message : 'Erreur'); setBusy(false); } }}>
        {err && <Alert title="Suppression impossible">{err}</Alert>}
        <Field label="Mot de passe" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        <div className="flex justify-end gap-2"><Button type="button" onClick={onClose}>Annuler</Button><Button type="submit" variant="danger" loading={busy} disabled={!pw}>Supprimer définitivement</Button></div>
      </form>
    </Modal>
  );
}

function TwoFactorCard() {
  const { user, refresh } = useAuth();
  const [modal, setModal] = useState<'enable' | 'disable' | null>(null);
  if (!user) return null;
  const on = !!user.twoFactorEnabled;
  return (
    <section className="mt-6 rounded-lg border border-line bg-panel p-4" aria-labelledby="2fa-title">
      <div className="flex items-start gap-3.5">
        <ShieldCheck size={20} strokeWidth={1.75} className={on ? 'text-accent' : 'text-muted'} />
        <div className="min-w-0 flex-1">
          <h2 id="2fa-title" className="flex items-center gap-2 text-[15px] font-medium">Double authentification {on ? <Badge tone="accent">Activée</Badge> : <Badge>Désactivée</Badge>}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">Ajoute un code à 6 chiffres, généré par une application d’authentification, en plus du mot de passe.{user.role === 'ADMIN' && !on ? ' Recommandé pour un compte administrateur.' : ''}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        {on ? <Button size="sm" onClick={() => setModal('disable')}>Désactiver</Button> : <Button size="sm" variant="primary" onClick={() => setModal('enable')}><KeyRound size={15} />Activer</Button>}
      </div>
      {modal === 'enable' && <EnableDialog onClose={() => setModal(null)} onDone={() => { setModal(null); void refresh(); }} />}
      {modal === 'disable' && <DisableDialog onClose={() => setModal(null)} onDone={() => { setModal(null); void refresh(); }} />}
    </section>
  );
}

function EnableDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<'loading' | 'scan' | 'codes'>('loading');
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[]>([]); const [saved, setSaved] = useState(false); const [copied, setCopied] = useState(false);
  useEffect(() => {
    let alive = true;
    api<{ secret: string; otpauthUri: string }>('POST', '/auth/2fa/setup').then(async (s) => {
      if (!alive) return; setSetup(s); setStep('scan');
      try { const svg = await QRCode.toString(s.otpauthUri, { type: 'svg', margin: 1, color: { dark: '#000000', light: '#ffffff' } }); if (alive) setQr(svg); } catch { /* the manual key stays available */ }
    }).catch((x) => { if (alive) { setErr(x instanceof ApiError ? x.message : 'Erreur'); setStep('scan'); } });
    return () => { alive = false; };
  }, []);
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* user can select the text */ } };
  const spaced = setup?.secret.match(/.{1,4}/g)?.join(' ') ?? '';
  return (
    <Modal title="Activer la double authentification" onClose={step === 'codes' ? onDone : onClose}>
      {step === 'loading' && <p className="mt-3 text-sm text-muted">Préparation…</p>}
      {step === 'scan' && (
        <form className="mt-3 flex flex-col gap-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { const r = await api<{ recoveryCodes: string[] }>('POST', '/auth/2fa/enable', { code }); setCodes(r.recoveryCodes); setStep('codes'); } catch (x) { setErr(x instanceof ApiError ? (x.status === 400 ? 'Code incorrect. Vérifiez l’heure de votre téléphone.' : x.message) : 'Erreur'); } setBusy(false); }}>
          {isDemo && <Alert kind="info" title="Aperçu">Clé factice, non valide. Code accepté : {DEMO_2FA_CODE}.</Alert>}
          {err && <Alert title="Impossible">{err}</Alert>}
          {setup && (<>
            <p className="text-sm text-muted">1. Scannez ce QR code avec votre application (Google Authenticator, Aegis, 1Password…).</p>
            {qr && <div className="mx-auto h-44 w-44 overflow-hidden rounded-md bg-white p-1 [&>svg]:h-full [&>svg]:w-full" role="img" aria-label="QR code de configuration" dangerouslySetInnerHTML={{ __html: qr }} />}
            <div className="text-sm text-muted">Sur le même téléphone ? <a className="text-white underline" href={setup.otpauthUri}>Ouvrir dans l’application</a>. Sinon, saisissez la clé :</div>
            <div className="flex items-center gap-2 rounded-md border border-line bg-bg px-3 py-2"><code className="min-w-0 flex-1 break-all font-mono text-[13px] tracking-wide">{spaced}</code>
              <button type="button" onClick={() => copy(setup.secret)} className="text-muted hover:text-white" aria-label="Copier la clé"><Copy size={16} /></button></div>
            {copied && <p className="text-xs text-muted" role="status">Copié.</p>}
            <p className="text-sm text-muted">2. Saisissez le code à 6 chiffres affiché.</p>
            <Field label="Code à 6 chiffres" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          </>)}
          <div className="flex justify-end gap-2"><Button type="button" onClick={onClose}>Annuler</Button><Button type="submit" variant="primary" loading={busy} disabled={code.length !== 6 || !setup}>Activer</Button></div>
        </form>
      )}
      {step === 'codes' && (
        <div className="mt-3 flex flex-col gap-4">
          <Alert kind="success" title="Double authentification activée">Conservez ces codes de secours : chacun ne sert qu’une fois et ils ne seront plus affichés.</Alert>
          <ul className="grid grid-cols-2 gap-2 rounded-md border border-line bg-bg p-3 font-mono text-[13px]">{codes.map((c) => <li key={c}>{c}</li>)}</ul>
          <Button size="sm" onClick={() => copy(codes.join('\n'))}><Copy size={15} />{copied ? 'Copié' : 'Copier les codes'}</Button>
          <label className="flex items-start gap-3 text-sm text-soft"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#8b5cf6]" checked={saved} onChange={(e) => setSaved(e.target.checked)} />J’ai enregistré mes codes de secours dans un endroit sûr.</label>
          <div className="flex justify-end"><Button variant="primary" disabled={!saved} onClick={onDone}>Terminer</Button></div>
        </div>
      )}
    </Modal>
  );
}

function DisableDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [pw, setPw] = useState(''); const [code, setCode] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  return (
    <Modal title="Désactiver la double authentification" onClose={onClose}>
      <p className="mt-2 text-sm text-muted">Confirmez avec votre mot de passe et un code de votre application (ou un code de secours).</p>
      <form className="mt-4 flex flex-col gap-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { await api('POST', '/auth/2fa/disable', { password: pw, code: code.trim() }); onDone(); } catch (x) { setErr(x instanceof ApiError ? (x.status === 401 ? 'Code incorrect.' : x.status === 403 ? 'Mot de passe incorrect.' : x.message) : 'Erreur'); setBusy(false); } }}>
        {err && <Alert title="Impossible">{err}</Alert>}
        <Field label="Mot de passe" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        <Field label="Code" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
        <div className="flex justify-end gap-2"><Button type="button" onClick={onClose}>Annuler</Button><Button type="submit" variant="danger" loading={busy} disabled={!pw || code.trim().length < 6}>Désactiver</Button></div>
      </form>
    </Modal>
  );
}
