import { ButtonLink, PageTitle } from '../components/ui';
export const NotFound = () => (<div className="max-w-sm"><PageTitle title="Page introuvable" sub="Cette adresse n’existe pas ou a été déplacée." /><div className="mt-6"><ButtonLink to="/" variant="primary">Retour à l’accueil</ButtonLink></div></div>);
