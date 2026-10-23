import { Link, Navigate, useParams } from 'react-router-dom';
import { Alert, PageTitle } from '../components/ui';

export const LEGAL = [
  { slug: 'confidentialite', short: 'Confidentialité', title: 'Politique de confidentialité', needs: ['Identité juridique de l’exploitant', 'Coordonnées de contact pour les demandes de données', 'Pays d’établissement', 'Prestataires réellement utilisés (hébergement, base de données, e-mails, Google)', 'Durées de conservation (comptes, sessions, journaux)'] },
  { slug: 'conditions', short: 'Conditions', title: 'Conditions générales d’utilisation', needs: ['Identité juridique de l’exploitant', 'Public visé (âge minimum, pays)', 'Règles d’usage des outils de téléchargement', 'Droit applicable et juridiction'] },
  { slug: 'cookies', short: 'Cookies', title: 'Politique relative aux cookies', needs: ['Liste réelle des cookies et traceurs utilisés', 'Finalité et durée de chacun', 'Décision sur d’éventuels cookies non essentiels (consentement requis)'] },
  { slug: 'mentions-legales', short: 'Mentions légales', title: 'Mentions légales', needs: ['Nom ou raison sociale de l’éditeur', 'Adresse et contact', 'Directeur de la publication', 'Hébergeurs (frontend, API, base de données)'] },
  { slug: 'droit-auteur', short: 'Droits d’auteur', title: 'Politique de droits d’auteur', needs: ['Procédure de notification des ayants droit', 'Contact dédié', 'Délais de traitement'] },
  { slug: 'utilisation-acceptable', short: 'Utilisation acceptable', title: 'Politique d’utilisation acceptable', needs: ['Usages interdits', 'Mesures en cas d’abus (suspension, suppression)'] },
  { slug: 'signalement', short: 'Signalement', title: 'Signaler un contenu ou un abus', needs: ['Canal de signalement (formulaire ou adresse)', 'Procédure et délais de réponse'] },
  { slug: 'suppression', short: 'Suppression des données', title: 'Suppression de compte et de données', needs: ['Procédure exacte', 'Données conservées après suppression et durée', 'Contact en cas de difficulté'] },
  { slug: 'contact-juridique', short: 'Contact juridique', title: 'Contact juridique', needs: ['Adresse e-mail ou postale dédiée'] },
];

export function LegalIndex() {
  return (
    <div className="max-w-2xl"><PageTitle title="Informations légales" />
      <ul className="mt-8 divide-y divide-line rounded-lg border border-line">
        {LEGAL.map((l) => <li key={l.slug}><Link to={`/legal/${l.slug}`} className="flex h-14 items-center px-4 text-[15px] font-medium hover:bg-hover">{l.title}</Link></li>)}
      </ul>
    </div>
  );
}

export function LegalPage() {
  const { slug } = useParams();
  const page = LEGAL.find((l) => l.slug === slug);
  if (!page) return <Navigate to="/legal" replace />;
  return (
    <div className="max-w-2xl">
      <PageTitle title={page.title} />
      <div className="mt-8 flex flex-col gap-6">
        <Alert kind="info" title="Texte non rédigé">Ce document sera écrit à partir d’informations que seul l’exploitant peut fournir. Aucun texte juridique n’a été inventé.</Alert>
        <div><p className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">Informations à fournir</p>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-soft">{page.needs.map((n) => <li key={n}>{n}</li>)}</ul></div>
      </div>
    </div>
  );
}
