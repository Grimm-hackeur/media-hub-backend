import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';
const variants: Record<Variant, string> = {
  primary: 'bg-white text-black hover:bg-neutral-200 active:bg-neutral-300 font-semibold',
  outline: 'border border-line-strong/60 bg-panel text-white hover:bg-hover hover:border-line-strong',
  ghost: 'text-soft hover:text-white hover:bg-hover',
  danger: 'border border-[#5b2a2a] text-danger hover:bg-[#2a1414]',
};
const sizes = { md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-[15px]', sm: 'h-8 px-3 text-[13px]' };

export function Button({ variant = 'outline', size = 'md', loading, children, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes; loading?: boolean }) {
  return (
    <button {...p} disabled={p.disabled || loading} className={cx(base, variants[variant], sizes[size], className)}>
      {loading && <Loader2 size={16} className="mh-spin" aria-hidden />}{children}
    </button>
  );
}
export function ButtonLink({ variant = 'outline', size = 'md', className, ...p }: LinkProps & { variant?: Variant; size?: keyof typeof sizes }) {
  return <Link {...p} className={cx(base, variants[variant], sizes[size], className)} />;
}

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; leading?: ReactNode; trailing?: ReactNode }>(
  function Field({ label, error, hint, leading, trailing, id, className, ...p }, ref) {
    const fid = id ?? p.name ?? label;
    return (
      <div className={cx('flex flex-col gap-2', className)}>
        <label htmlFor={fid} className="text-sm font-medium">{label}</label>
        <div className={cx('flex h-12 items-center gap-2 rounded-md border bg-bg px-3 transition-colors focus-within:border-accent', error ? 'border-danger' : 'border-line')}>
          {leading}
          <input ref={ref} id={fid} aria-invalid={!!error} aria-describedby={error ? fid + '-e' : hint ? fid + '-h' : undefined}
            className="h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-muted focus-visible:outline-none" {...p} />
          {trailing}
        </div>
        {error ? <p id={fid + '-e'} role="alert" className="text-[13px] text-danger">{error}</p> : hint ? <p id={fid + '-h'} className="text-[13px] text-muted">{hint}</p> : null}
      </div>
    );
  });

export const SectionLabel = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div className="flex h-5 items-center justify-between font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted"><span>{children}</span>{right}</div>
);

export const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={cx('rounded-[10px] border border-line bg-panel', className)}>{children}</section>
);

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'white' | 'danger' }) {
  const t = { neutral: 'text-soft border-[#303030]', accent: 'text-accent-soft border-[#4c3a8a] bg-accent/10', white: 'text-white border-white', danger: 'text-danger border-[#5b2a2a]' }[tone];
  return <span className={cx('inline-flex h-[22px] items-center whitespace-nowrap rounded-full border px-2 text-xs font-medium', t)}>{children}</span>;
}

export function Alert({ kind = 'error', title, children, action }: { kind?: 'error' | 'success' | 'info'; title: string; children?: ReactNode; action?: ReactNode }) {
  const Icon = kind === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={cx('mh-fade flex gap-3 rounded-lg border bg-panel p-4', kind === 'error' ? 'border-line-strong' : 'border-line')}>
      <Icon size={18} className={cx('mt-0.5 shrink-0', kind === 'error' ? 'text-danger' : 'text-soft')} aria-hidden />
      <div className="flex min-w-0 flex-col gap-2"><div><p className="text-sm font-medium">{title}</p>{children && <p className="text-[13px] text-muted">{children}</p>}</div>{action}</div>
    </div>
  );
}

export const Spinner = ({ label = 'Chargement…' }: { label?: string }) => (
  <div role="status" className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-4 text-sm"><Loader2 size={16} className="mh-spin" aria-hidden />{label}</div>
);

export const Empty = ({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) => (
  <div className="flex items-center gap-3.5 rounded-lg border border-line bg-panel px-4 py-4">
    <span className="text-muted">{icon}</span>
    <div className="leading-snug"><p className="text-sm font-medium">{title}</p>{text && <p className="text-[13px] text-muted">{text}</p>}</div>
  </div>
);

export function PageTitle({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] md:text-[32px]">{title}</h1>{sub && <p className="mt-2 text-[15px] text-muted">{sub}</p>}</div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="mh-fade w-full max-w-md rounded-t-2xl border border-line bg-panel p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>{children}
      </div>
    </div>
  );
}
