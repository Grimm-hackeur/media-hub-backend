import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../lib/api';
import { cx } from '../ui';
import './otp.css';

export const OTP_LENGTH = 4;
const DOTS = Array.from({ length: 14 }, (_, i) => {
  const a = i * 2.399963 + 0.4, d = 70 + ((i * 37) % 46); // golden-angle spread, deterministic
  return { cx: Math.cos(a) * d, cy: Math.sin(a) * d, delay: 0.08 + (i % 5) * 0.04, tone: ['#8B5CF6', '#C4B5FD', '#FFFFFF', '#A1A1A1'][i % 4]! };
});

type Phase = 'idle' | 'verifying' | 'success' | 'error';
export interface OtpProps {
  email: string;
  /** Must resolve ONLY when the server confirmed the code. Reject with ApiError otherwise. */
  onVerify(code: string): Promise<void>;
  onResend(): Promise<{ retryAfter: number }>;
  /** Called after the success animation. */
  onDone(): void;
  initialCooldown?: number;
}

export function OtpVerification({ email, onVerify, onResend, onDone, initialCooldown = 60 }: OtpProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [shake, setShake] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const phaseRef = useRef<Phase>('idle');
  const doneTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  useEffect(() => { refs.current[0]?.focus(); return () => clearTimeout(doneTimer.current); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const end = Date.now() + cooldown * 1000;
    const t = setInterval(() => { const left = Math.ceil((end - Date.now()) / 1000); setCooldown(Math.max(0, left)); if (left <= 0) clearInterval(t); }, 250);
    return () => clearInterval(t);
    // restart only when a new cooldown is set from a positive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooldown > 0]);

  const busy = phase === 'verifying' || phase === 'success';
  const focusAt = (i: number) => { const el = refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]; el?.focus(); el?.select(); };

  const submit = useCallback(async (code: string) => {
    if (phaseRef.current === 'verifying' || phaseRef.current === 'success') return;
    setPhaseBoth('verifying'); setError(null); setNotice(null);
    try {
      await onVerify(code);
      setPhaseBoth('success');
      const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      doneTimer.current = setTimeout(onDone, reduced ? 600 : 1900);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', 'Erreur inattendue. Réessayez.');
      let msg = err.message;
      if (err.code === 'OTP_INVALID') { const n = err.meta?.attemptsLeft; msg = n === undefined ? 'Code incorrect.' : `Code incorrect. ${n} essai${n > 1 ? 's' : ''} restant${n > 1 ? 's' : ''}.`; }
      else if (err.code === 'OTP_EXPIRED') { msg = 'Ce code a expiré. Demandez-en un nouveau.'; setLocked(true); }
      else if (err.code === 'OTP_LOCKED') { msg = 'Trop d’essais. Demandez un nouveau code.'; setLocked(true); }
      else if (err.status === 429 && err.meta?.retryAfter) { setCooldown(err.meta.retryAfter); }
      setError(msg); setPhaseBoth('error'); setShake(true); setTimeout(() => setShake(false), 500);
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => focusAt(0), 30);
    }
  }, [onVerify, onDone]);

  const place = (start: number, raw: string) => {
    const only = raw.replace(/\D/g, '').slice(0, OTP_LENGTH - start);
    if (!only) return;
    const next = [...digits];
    [...only].forEach((c, k) => { next[start + k] = c; });
    setDigits(next);
    const end = start + only.length;
    if (next.every(Boolean)) void submit(next.join('')); else focusAt(end);
  };
  const edited = () => { if (phase === 'error') { setPhaseBoth('idle'); setError(null); } setNotice(null); };

  const onChange = (i: number, v: string) => {
    if (busy || locked) return; edited();
    if (v === '') { const n = [...digits]; n[i] = ''; setDigits(n); return; }
    // a full code arriving in one box = autofill (SMS / keyboard suggestion); otherwise keep the last typed digit
    if (v.replace(/\D/g, '').length >= OTP_LENGTH) place(0, v); else place(i, v.slice(-1));
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (busy) return;
    if (e.key === 'Backspace' && !digits[i] && i > 0) { e.preventDefault(); const n = [...digits]; n[i - 1] = ''; setDigits(n); focusAt(i - 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); focusAt(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focusAt(i + 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusAt(0); }
    else if (e.key === 'End') { e.preventDefault(); focusAt(OTP_LENGTH - 1); }
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault(); if (busy || locked) return; edited();
    const text = e.clipboardData.getData('text');
    const clean = text.replace(/\D/g, '');
    if (clean.length >= OTP_LENGTH) place(0, clean); else if (clean) place(Number((e.target as HTMLInputElement).dataset.i), clean);
  };

  async function resend() {
    if (cooldown > 0 || resending || busy) return;
    setResending(true); setError(null); setNotice(null);
    try {
      const r = await onResend();
      setCooldown(r.retryAfter); setLocked(false); setPhaseBoth('idle'); setDigits(Array(OTP_LENGTH).fill(''));
      setNotice('Un nouveau code vient d’être envoyé. Les anciens codes ne sont plus valables.'); setTimeout(() => focusAt(0), 30);
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      if (err?.meta?.retryAfter) setCooldown(err.meta.retryAfter);
      setError(err?.message ?? 'Envoi impossible. Réessayez.'); setPhaseBoth('error');
    } finally { setResending(false); }
  }

  const title = phase === 'success' ? 'Adresse confirmée' : phase === 'verifying' ? 'Vérification…' : 'Saisissez le code';
  const sub = phase === 'success' ? 'Votre compte est actif. Redirection…' : phase === 'verifying' ? 'Le serveur vérifie votre code.' : <>Un code à {OTP_LENGTH} chiffres a été envoyé à <b className="break-all font-medium text-white">{email}</b>. Il expire dans 10 minutes.</>;
  const orbit = useMemo(() => digits.map((d, i) => { const a = (i / OTP_LENGTH) * Math.PI * 2 - Math.PI / 2; return { d, dx: Math.cos(a) * 66, dy: Math.sin(a) * 66, delay: `${i * 60}ms` }; }), [digits]);

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-line bg-panel px-5 py-8 text-center sm:px-8">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mx-auto mt-2 max-w-[300px] text-sm leading-relaxed text-muted">{sub}</p>

      <div className="otp-stage mt-6" data-busy={busy} aria-busy={phase === 'verifying'}>
        <div role="group" aria-label={`Code de vérification à ${OTP_LENGTH} chiffres`} className={cx('otp-inputs', shake && 'otp-shake')} data-hidden={busy}>
          {digits.map((d, i) => (
            <input key={i} ref={(el) => { refs.current[i] = el; }} data-i={i} value={d} disabled={busy || locked} aria-label={`Chiffre ${i + 1} sur ${OTP_LENGTH}`}
              type="text" inputMode="numeric" pattern="[0-9]*" autoComplete={i === 0 ? 'one-time-code' : 'off'} enterKeyHint="done" aria-invalid={phase === 'error'}
              onChange={(e) => onChange(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} onPaste={onPaste} onFocus={(e) => e.target.select()}
              className={cx('h-14 w-12 rounded-xl border bg-bg text-center text-2xl font-semibold text-white caret-accent outline-none transition-colors min-[380px]:h-16 min-[380px]:w-14 disabled:opacity-60',
                phase === 'error' ? 'border-danger' : d ? 'border-accent' : 'border-line focus:border-accent')} />
          ))}
        </div>
        {phase === 'verifying' && (
          <div className="otp-orbit" aria-hidden>
            <div className="otp-orbit-ring">{orbit.map((n, i) => <div key={i} className="otp-node" style={{ ['--dx' as string]: `${n.dx}px`, ['--dy' as string]: `${n.dy}px`, ['--delay' as string]: n.delay }}>{n.d}</div>)}</div>
            <div className="otp-core" />
          </div>)}
        {phase === 'success' && (
          <div className="otp-success" aria-hidden>
            <i className="otp-wave" /><i className="otp-wave" style={{ ['--delay' as string]: '.15s' }} />
            {DOTS.map((d, i) => <i key={i} className="otp-dot" style={{ background: d.tone, ['--cx' as string]: `${d.cx}px`, ['--cy' as string]: `${d.cy}px`, ['--delay' as string]: `${d.delay}s` }} />)}
            <div className="otp-vault"><svg className="otp-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div>
            <span className="otp-badge">Vérifié</span>
          </div>)}
      </div>

      <div className="min-h-10" aria-live="polite">
        {error && <p role="alert" className="mh-fade text-[13px] font-medium text-danger">{error}</p>}
        {!error && notice && <p role="status" className="mh-fade text-[13px] text-soft">{notice}</p>}
        {phase === 'success' && <p className="sr-only" role="status">Adresse e-mail confirmée.</p>}
      </div>

      {phase !== 'success' && (
      <button type="button" onClick={resend} disabled={cooldown > 0 || resending || busy}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md px-4 text-[13px] text-soft transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
        {resending ? 'Envoi…' : cooldown > 0 ? <>Renvoyer le code dans <b className="ml-1 tabular-nums text-white">{cooldown} s</b></> : <>Vous n’avez rien reçu ? <b className="ml-1 text-accent-soft">Renvoyer le code</b></>}
      </button>
      )}
      {!busy && <div><Link to="/inscription" className="text-[13px] text-muted underline hover:text-white">Modifier l’adresse e-mail</Link></div>}
    </div>
  );
}
