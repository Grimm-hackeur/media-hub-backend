import { useId, useState } from 'react';

export interface Point { t: string; requests: number; errors: number }

/** Dependency-free SVG bar chart: requests (violet) with failed requests overlaid (red). Hover/focus for exact values. */
export function UsageChart({ points, range }: { points: Point[]; range: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const W = 640, H = 180, padL = 48, padB = 28, padT = 8;
  const max = Math.max(1, ...points.map((p) => p.requests));
  const nice = (() => { const m = Math.pow(10, Math.floor(Math.log10(max))); return Math.ceil(max / m) * m; })();
  const bw = (W - padL) / points.length;
  const label = (t: string) => { const d = new Date(t); return range === '24h' ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); };
  const total = points.reduce((s, p) => s + p.requests, 0);
  const h = hover === null ? null : points[hover];
  const every = Math.ceil(points.length / 6);
  return (
    <figure className="m-0">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} className="block h-auto w-full" onMouseLeave={() => setHover(null)}>
          <title id={id}>Requêtes sur la période : {total.toLocaleString('fr-FR')}</title>
          {[0, 0.5, 1].map((f) => { const y = padT + (H - padB - padT) * (1 - f); return (
            <g key={f}><line x1={padL} x2={W} y1={y} y2={y} stroke="#262626" strokeWidth="1" /><text x={padL - 6} y={y + 3} textAnchor="end" fontSize="15" fill="#8A8A8A" fontFamily="Geist Mono, monospace">{Math.round(nice * f).toLocaleString('fr-FR')}</text></g>); })}
          {points.map((p, i) => {
            const ch = (H - padB - padT), hh = (p.requests / nice) * ch, eh = (p.errors / nice) * ch, x = padL + i * bw;
            return (
              <g key={p.t} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${label(p.t)} : ${p.requests} requêtes, ${p.errors} erreurs`}>
                <rect x={x} y={padT} width={bw} height={ch} fill="transparent" />
                <rect x={x + bw * 0.14} y={padT + ch - hh} width={bw * 0.72} height={Math.max(hh, p.requests ? 1 : 0)} rx="1.5" fill={hover === i ? '#A78BFA' : '#8B5CF6'} />
                {p.errors > 0 && <rect x={x + bw * 0.14} y={padT + ch - eh} width={bw * 0.72} height={Math.max(eh, 1.5)} rx="1" fill="#F87171" />}
                {i % every === 0 && <text x={x + bw / 2} y={H - 7} textAnchor="middle" fontSize="15" fill="#8A8A8A" fontFamily="Geist Mono, monospace">{label(p.t)}</text>}
              </g>);
          })}
        </svg>
        {h && <div role="status" className="pointer-events-none absolute right-2 top-0 rounded-md border border-line-strong bg-bg px-2.5 py-1.5 font-mono text-[11px] leading-snug"><div className="text-muted">{label(h.t)}</div><div>{h.requests.toLocaleString('fr-FR')} req.</div><div className="text-danger">{h.errors.toLocaleString('fr-FR')} err.</div></div>}
      </div>
      <figcaption className="mt-2 flex gap-4 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-accent" />Requêtes</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-danger" />Erreurs</span></figcaption>
    </figure>
  );
}
