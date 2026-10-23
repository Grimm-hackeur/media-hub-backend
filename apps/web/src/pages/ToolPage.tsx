import { useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ClipboardPaste, Inbox, Link2, Search } from 'lucide-react';
import { Alert, Button, Field, PageTitle, SectionLabel, Empty } from '../components/ui';
import { api, ApiError } from '../lib/api';
import { checkLink, toolById, type Tool } from '../features/tools';

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'invalid'; message: string } | { kind: 'unavailable' } | { kind: 'error'; message: string };

export function ToolPage() {
  const tool = toolById(useParams().toolId);
  if (!tool) return <Navigate to="/outils" replace />;
  return <ToolForm key={tool.id} tool={tool} />;
}

function ToolForm({ tool }: { tool: Tool }) {
  const isMusic = tool.id === 'music';
  const [value, setValue] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function paste() {
    try { setValue(await navigator.clipboard.readText()); } catch { setState({ kind: 'invalid', message: 'Le presse-papiers n’est pas accessible. Collez le lien avec le clavier.' }); }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (isMusic) {
      if (value.trim().length < 2) return setState({ kind: 'invalid', message: 'Saisissez au moins 2 caractères.' });
    } else {
      const c = checkLink(value, tool);
      if (!c.ok) return setState({ kind: 'invalid', message: c.message });
    }
    setState({ kind: 'loading' });
    try {
      // The backend has no tool endpoints yet: this request is real and fails honestly until a provider is integrated.
      await api('POST', `/tools/${tool.id}/${isMusic ? 'search' : 'analyze'}`, isMusic ? { query: value.trim() } : { url: value.trim() });
      setState({ kind: 'error', message: 'Réponse inattendue du serveur.' });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 501 || err.status === 503)) setState({ kind: 'unavailable' });
      else setState({ kind: 'error', message: err instanceof ApiError ? err.message : 'Erreur inattendue.' });
    }
  }

  return (
    <div className="max-w-xl">
      <Link to="/outils" className="-ml-1 inline-flex h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-white"><ArrowLeft size={16} />Outils</Link>
      <PageTitle title={tool.name} sub={tool.description} />
      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
        <Field label={isMusic ? 'Recherche' : 'Lien de la vidéo'} name="q" value={value} onChange={(e) => { setValue(e.target.value); if (state.kind !== 'idle') setState({ kind: 'idle' }); }}
          placeholder={tool.placeholder} type={isMusic ? 'search' : 'url'} autoComplete="off" inputMode={isMusic ? 'search' : 'url'}
          leading={isMusic ? <Search size={18} className="text-muted" /> : <Link2 size={18} className="text-muted" />}
          error={state.kind === 'invalid' ? state.message : undefined}
          hint={isMusic ? undefined : 'Copiez le lien depuis le bouton Partager de l’application.'}
          trailing={isMusic ? undefined : <Button type="button" size="sm" onClick={paste} title="Coller depuis le presse-papiers" aria-label="Coller le lien" className="shrink-0 bg-bg"><ClipboardPaste size={14} />Coller</Button>} />
        <Button type="submit" variant="primary" size="lg" loading={state.kind === 'loading'}>{isMusic ? 'Rechercher' : 'Analyser le lien'}</Button>
      </form>

      <div className="mt-8"><SectionLabel>Résultat</SectionLabel>
        <div className="mt-3" aria-live="polite">
          {state.kind === 'unavailable' ? (
            <Alert title="Service non connecté" action={<span className="text-[13px] text-muted">Aucun fournisseur n’est encore intégré pour {tool.name}. Aucun résultat n’est simulé.</span>}>L’analyse n’a pas pu être effectuée.</Alert>
          ) : state.kind === 'error' ? <Alert title="Une erreur est survenue">{state.message}</Alert>
          : state.kind === 'loading' ? <Empty icon={<Inbox size={20} />} title="Analyse en cours…" />
          : <Empty icon={<Inbox size={20} />} title={isMusic ? 'Aucune recherche' : 'Aucun lien analysé'} text="Le résultat apparaîtra ici." />}
        </div></div>

      <div className="mt-8"><SectionLabel>À savoir</SectionLabel>
        <ul className="mt-2 text-sm text-muted">{tool.notes.map((n) => <li key={n} className="flex items-start gap-2.5 py-1.5"><Check size={14} className="mt-1 shrink-0" />{n}</li>)}</ul></div>
    </div>
  );
}
