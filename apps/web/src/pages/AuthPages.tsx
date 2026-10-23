import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Field, PageTitle, Spinner } from '../components/ui';
import { api, ApiError, type User } from '../lib/api';
import { isDemo, DEMO_OTP } from '../lib/demo';
import { OtpVerification } from '../components/otp/OtpVerification';
import { useAuth } from '../auth/AuthContext';

const email = z.string().trim().min(1, 'Saisissez votre e-mail').email('Adresse e-mail invalide');
const password = z.string().min(10, '10 caractères minimum').max(128, '128 caractères maximum');
export const loginSchema = z.object({ email, password: z.string().min(1, 'Saisissez votre mot de passe') });
export const registerSchema = z.object({
  username: z.string().trim().min(3, '3 caractères minimum').max(30, '30 caractères maximum').regex(/^[\p{L}\p{N}_.-]+$/u, 'Lettres, chiffres, point, tiret et underscore uniquement'),
  email, password, confirmPassword: z.string().min(1, 'Confirmez le mot de passe'), acceptTerms: z.boolean().refine((v) => v, 'Vous devez accepter les conditions'),
}).refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Les mots de passe ne correspondent pas' });

const Shell = ({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) => (
  <div className="mx-auto w-full max-w-sm md:pt-6"><PageTitle title={title} sub={sub} /><div className="mt-8 flex flex-col gap-4">{children}</div></div>
);
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : 'Erreur inattendue.');

function GoogleButton() {
  return (<div className="flex flex-col gap-1.5"><Button type="button" disabled size="lg" title="Bientôt disponible">Continuer avec Google</Button>
    <p className="text-center text-xs text-muted">Connexion Google : bientôt disponible.</p></div>);
}
const Or = () => <div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" /></div>;

export function LoginPage() {
  const { login, loginTwoFactor, user } = useAuth();
  const nav = useNavigate();
  const [challenge, setChallenge] = useState<string | null>(null);
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/compte';
  const [error, setError] = useState<string | null>(null);
  const f = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : from} replace />;
  if (challenge) return <TwoFactorStep onSubmit={async (code) => { await loginTwoFactor(challenge, code); nav(from, { replace: true }); }} onBack={() => setChallenge(null)} />;
  return (
    <Shell title="Connexion" sub="Accédez à votre compte Media Hub.">
      <GoogleButton /><Or />
      <form noValidate className="flex flex-col gap-4" onSubmit={f.handleSubmit(async (v) => { setError(null); try { const r = await login(v.email, v.password); if (r.twoFactorRequired) setChallenge(r.challenge); else nav(from, { replace: true }); } catch (e) { setError(errMsg(e)); } })}>
        {error && <Alert title="Connexion impossible">{error}</Alert>}
        <Field label="Adresse e-mail" type="email" autoComplete="email" inputMode="email" error={f.formState.errors.email?.message} {...f.register('email')} />
        <Field label="Mot de passe" type="password" autoComplete="current-password" error={f.formState.errors.password?.message} {...f.register('password')} />
        <Button type="submit" variant="primary" size="lg" loading={f.formState.isSubmitting}>Se connecter</Button>
      </form>
      <div className="flex justify-between text-sm text-muted"><Link to="/mot-de-passe-oublie" className="hover:text-white">Mot de passe oublié ?</Link><Link to="/inscription" className="hover:text-white">Créer un compte</Link></div>
    </Shell>
  );
}

function TwoFactorStep({ onSubmit, onBack }: { onSubmit(code: string): Promise<void>; onBack(): void }) {
  const [code, setCode] = useState(''); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  return (
    <Shell title="Vérification en deux étapes" sub="Saisissez le code à 6 chiffres de votre application d’authentification, ou un code de secours.">
      <form noValidate className="flex flex-col gap-4" onSubmit={async (e) => {
        e.preventDefault(); setError(null); setBusy(true);
        try { await onSubmit(code.trim()); } catch (x) {
          setError(x instanceof ApiError && x.code === 'TWO_FACTOR_LOCKED' ? 'Trop d’essais. Réessayez dans quelques minutes.' : x instanceof ApiError && x.status === 401 ? 'Code incorrect ou expiré. Si la session a expiré, reprenez la connexion.' : errMsg(x));
          setBusy(false);
        }
      }}>
        {error && <Alert title="Vérification impossible">{error}</Alert>}
        <Field label="Code" inputMode="text" autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} hint="6 chiffres, ou un code de secours (xxxxx-xxxxx)." />
        <Button type="submit" variant="primary" size="lg" loading={busy} disabled={code.trim().length < 6}>Valider</Button>
      </form>
      <button type="button" onClick={onBack} className="text-left text-sm text-muted hover:text-white">← Revenir à la connexion</button>
    </Shell>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const f = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema), defaultValues: { username: '', email: '', password: '', confirmPassword: '', acceptTerms: false as unknown as true } });
  return (
    <Shell title="Créer un compte" sub="Gratuit, sans carte bancaire.">
      <GoogleButton /><Or />
      <form noValidate className="flex flex-col gap-4" onSubmit={f.handleSubmit(async ({ confirmPassword: _c, ...v }) => { setError(null); try { await api('POST', '/auth/register', v); nav('/verification-email', { state: { email: v.email } }); } catch (e) { setError(errMsg(e)); } })}>
        {error && <Alert title="Inscription impossible">{error}</Alert>}
        <Field label="Nom d’affichage" autoComplete="username" error={f.formState.errors.username?.message} {...f.register('username')} />
        <Field label="Adresse e-mail" type="email" autoComplete="email" inputMode="email" error={f.formState.errors.email?.message} {...f.register('email')} />
        <Field label="Mot de passe" type="password" autoComplete="new-password" hint="10 caractères minimum." error={f.formState.errors.password?.message} {...f.register('password')} />
        <Field label="Confirmer le mot de passe" type="password" autoComplete="new-password" error={f.formState.errors.confirmPassword?.message} {...f.register('confirmPassword')} />
        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-3 text-sm text-soft"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#8b5cf6]" {...f.register('acceptTerms')} />
            <span>J’accepte les <Link to="/legal/conditions" className="underline hover:text-white">conditions d’utilisation</Link> et la <Link to="/legal/confidentialite" className="underline hover:text-white">politique de confidentialité</Link>.</span></label>
          {f.formState.errors.acceptTerms && <p role="alert" className="text-[13px] text-danger">{f.formState.errors.acceptTerms.message}</p>}
        </div>
        <Button type="submit" variant="primary" size="lg" loading={f.formState.isSubmitting}>Créer mon compte</Button>
      </form>
      <p className="text-sm text-muted">Déjà inscrit ? <Link to="/connexion" className="text-white underline">Se connecter</Link></p>
    </Shell>
  );
}

export function ForgotPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const f = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email })), defaultValues: { email: '' } });
  return (
    <Shell title="Mot de passe oublié" sub="Nous vous envoyons un lien valable 30 minutes.">
      {done ? <Alert kind="success" title="Demande envoyée">Si un compte existe pour cette adresse, un e-mail vient d’être envoyé.</Alert> : (
        <form noValidate className="flex flex-col gap-4" onSubmit={f.handleSubmit(async (v) => { setError(null); try { await api('POST', '/auth/forgot-password', v); setDone(true); } catch (e) { setError(errMsg(e)); } })}>
          {error && <Alert title="Envoi impossible">{error}</Alert>}
          <Field label="Adresse e-mail" type="email" autoComplete="email" error={f.formState.errors.email?.message} {...f.register('email')} />
          <Button type="submit" variant="primary" size="lg" loading={f.formState.isSubmitting}>Envoyer le lien</Button>
        </form>)}
      <Link to="/connexion" className="text-sm text-muted hover:text-white">Retour à la connexion</Link>
    </Shell>
  );
}

export function ResetPage() {
  const token = useSearchParams()[0].get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const f = useForm<{ password: string }>({ resolver: zodResolver(z.object({ password })), defaultValues: { password: '' } });
  if (!token) return <Shell title="Lien invalide"><Alert title="Lien incomplet">Ouvrez le lien reçu par e-mail, ou refaites une demande.</Alert><Link to="/mot-de-passe-oublie" className="text-sm underline">Nouvelle demande</Link></Shell>;
  return (
    <Shell title="Nouveau mot de passe">
      {done ? <><Alert kind="success" title="Mot de passe mis à jour">Vos sessions ont été fermées. Connectez-vous avec le nouveau mot de passe.</Alert><Link to="/connexion" className="text-sm underline">Se connecter</Link></> : (
        <form noValidate className="flex flex-col gap-4" onSubmit={f.handleSubmit(async (v) => { setError(null); try { await api('POST', '/auth/reset-password', { token, password: v.password }); setDone(true); } catch (e) { setError(errMsg(e)); } })}>
          {error && <Alert title="Réinitialisation impossible">{error}</Alert>}
          <Field label="Nouveau mot de passe" type="password" autoComplete="new-password" hint="10 caractères minimum." error={f.formState.errors.password?.message} {...f.register('password')} />
          <Button type="submit" variant="primary" size="lg" loading={f.formState.isSubmitting}>Enregistrer</Button>
        </form>)}
    </Shell>
  );
}

export function VerifyEmailPage() {
  const token = useSearchParams()[0].get('token') ?? '';
  const email = (useLocation().state as { email?: string } | null)?.email;
  if (token) return <LinkVerify token={token} />;
  if (email) return <OtpScreen email={email} />;
  return <Shell title="Confirmation de l’adresse e-mail"><Alert title="Aucune inscription en cours">Créez un compte pour recevoir un code de vérification.</Alert><Link to="/inscription" className="text-sm underline">Créer un compte</Link></Shell>;
}

/** Legacy e-mail link (kept so links already sent keep working). */
function LinkVerify({ token }: { token: string }) {
  const [s, setS] = useState<'loading' | 'ok' | string>('loading');
  useEffect(() => { api('POST', '/auth/verify-email', { token }).then(() => setS('ok'), (e) => setS(errMsg(e))); }, [token]);
  return (
    <Shell title="Confirmation de l’adresse e-mail">
      {s === 'loading' ? <Spinner label="Vérification…" /> : s === 'ok' ? <><Alert kind="success" title="Adresse confirmée">Votre compte est vérifié.</Alert><Link to="/connexion" className="text-sm underline">Se connecter</Link></>
        : <Alert title="Lien invalide ou expiré">{s}</Alert>}
    </Shell>
  );
}

function OtpScreen({ email }: { email: string }) {
  const { applySession } = useAuth();
  const nav = useNavigate();
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 md:pt-6">
      {isDemo && <p className="rounded border border-dashed border-line-strong px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-muted">APERÇU · AUCUN E-MAIL N’EST ENVOYÉ. CODE ACCEPTÉ : {DEMO_OTP}. TOUT AUTRE CODE EST REFUSÉ (5 ESSAIS).</p>}
      <OtpVerification email={email}
        onVerify={async (code) => { const r = await api<{ user: User; csrfToken: string }>('POST', '/auth/verify-otp', { email, code }); applySession(r.user, r.csrfToken); }}
        onResend={() => api<{ retryAfter: number }>('POST', '/auth/resend-otp', { email })}
        onDone={() => nav('/compte', { replace: true })} />
    </div>
  );
}
