import type { LucideIcon } from 'lucide-react';
import { Panel } from './ui';

export const StatCard = ({ label, value, icon: Icon, hint }: { label: string; value: string; icon: LucideIcon; hint?: string }) => (
  <Panel className="min-w-0 p-4 sm:p-5">
    <div className="flex items-center justify-between gap-2 text-[13px] text-muted"><span className="truncate">{label}</span><Icon size={16} className="shrink-0" /></div>
    <div className="mt-2.5 text-2xl font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-3xl">{value}</div>
    {hint && <div className="mt-1.5 text-xs text-muted">{hint}</div>}
  </Panel>
);
export const fmt = (n: number) => n.toLocaleString('fr-FR');
export const pct = (r: number) => `${(r * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
export const RangeTabs = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div role="tablist" aria-label="Période" className="inline-flex rounded-md border border-line bg-bg p-0.5">
    {[['24h', '24 h'], ['7d', '7 jours'], ['30d', '30 jours']].map(([v, l]) => (
      <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v!)} type="button"
        className={`h-8 rounded px-3 text-[13px] font-medium transition-colors ${value === v ? 'bg-hover text-white' : 'text-muted hover:text-white'}`}>{l}</button>))}
  </div>
);
