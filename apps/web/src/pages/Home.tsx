import { Link } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import { Empty, SectionLabel } from '../components/ui';
import { ToolCard } from '../components/ToolCard';
import { TOOLS } from '../features/tools';

export function Home() {
  return (
    <div className="flex flex-col">
      <section className="max-w-3xl">
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.04em] md:text-[56px]">Vos outils média.</h1>
        <p className="mt-2 text-[15px] text-muted md:mt-4 md:text-lg">Collez un lien, récupérez le fichier.</p>
      </section>

      <section className="mt-7 md:mt-12">
        <SectionLabel right={<Link to="/outils" className="inline-flex items-center text-[13px] normal-case tracking-normal text-muted hover:text-white">Tout voir<ChevronRight size={14} /></Link>}>Outils</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
          {TOOLS.map((t) => <ToolCard key={t.id} tool={t} />)}
        </div>
      </section>

      <section className="mt-7 md:mt-10"><SectionLabel>Récents</SectionLabel>
        <div className="mt-3"><Empty icon={<Clock size={20} />} title="Aucun téléchargement récent" text="Vos derniers fichiers apparaîtront ici." /></div></section>

      <section className="mt-7 md:mt-10"><SectionLabel>Fonctionnement</SectionLabel>
        <ol className="mt-3 divide-y divide-line border-y border-line text-sm md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
          {['Copiez le lien depuis l’application.', 'Collez-le dans l’outil correspondant.', 'Choisissez le fichier proposé.'].map((s, i) => (
            <li key={s} className="flex h-10 items-center gap-3.5 md:h-auto md:flex-col md:items-start md:gap-2 md:px-5 md:py-5 md:first:pl-0">
              <span className="font-mono text-xs text-muted">0{i + 1}</span><span>{s}</span></li>))}
        </ol></section>
    </div>
  );
}
