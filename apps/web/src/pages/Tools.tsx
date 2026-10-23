import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PageTitle, SectionLabel } from '../components/ui';
import { TOOL_ICON } from '../components/ToolCard';
import { TOOLS } from '../features/tools';

export function Tools() {
  const cats = ['Vidéo', 'Audio'] as const;
  return (
    <div className="max-w-2xl">
      <PageTitle title="Outils" sub="Choisissez ce que vous voulez récupérer." />
      {cats.map((c) => (
        <section key={c} className="mt-8"><SectionLabel>{c}</SectionLabel>
          <div className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line">
            {TOOLS.filter((t) => t.category === c).map((t) => { const Icon = TOOL_ICON[t.id]; return (
              <Link key={t.id} to={`/outils/${t.id}`} className="flex h-16 items-center gap-3.5 px-4 transition-colors hover:bg-panel">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line"><Icon size={20} strokeWidth={1.75} /></span>
                <span className="min-w-0 flex-1 leading-snug"><span className="block text-[15px] font-medium">{t.name}</span><span className="block text-[13px] text-muted">{t.description}</span></span>
                <ChevronRight size={16} className="text-muted" />
              </Link>); })}
          </div></section>))}
      <p className="mt-6 text-[13px] text-muted">D’autres outils seront ajoutés ici.</p>
    </div>
  );
}
