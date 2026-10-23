export type ToolId = 'tiktok' | 'instagram' | 'facebook' | 'music';
export interface Tool { id: ToolId; name: string; tagline: string; description: string; category: 'Vidéo' | 'Audio'; hosts: string[]; placeholder: string; notes: string[] }

export const TOOLS: Tool[] = [
  { id: 'tiktok', name: 'TikTok', tagline: 'Vidéos courtes', description: 'Télécharger une vidéo publique.', category: 'Vidéo', hosts: ['tiktok.com'], placeholder: 'https://www.tiktok.com/…',
    notes: ['Liens publics uniquement.', 'Les options proposées dépendent de la source.', 'Téléchargez uniquement ce que vous avez le droit de télécharger.'] },
  { id: 'instagram', name: 'Instagram', tagline: 'Reels et posts', description: 'Télécharger un Reel ou une vidéo publique.', category: 'Vidéo', hosts: ['instagram.com'], placeholder: 'https://www.instagram.com/…',
    notes: ['Comptes privés inaccessibles.', 'Aucun mot de passe ne vous sera jamais demandé.', 'Téléchargez uniquement ce que vous avez le droit de télécharger.'] },
  { id: 'facebook', name: 'Facebook', tagline: 'Vidéos publiques', description: 'Télécharger une vidéo publique.', category: 'Vidéo', hosts: ['facebook.com', 'fb.watch'], placeholder: 'https://www.facebook.com/…',
    notes: ['Vidéos privées et groupes fermés inaccessibles.', 'Une vidéo supprimée ne peut pas être récupérée.', 'Téléchargez uniquement ce que vous avez le droit de télécharger.'] },
  { id: 'music', name: 'Musique', tagline: 'Recherche de titres', description: 'Chercher un titre, un artiste ou un album.', category: 'Audio', hosts: [], placeholder: 'Titre, artiste ou album',
    notes: ['Trouver un titre ne signifie pas qu’il est téléchargeable.', 'Chaque résultat indiquera sa source et ses droits.', 'Le téléchargement n’est proposé que si la source l’autorise.'] },
];
export const toolById = (id: string | undefined) => TOOLS.find((t) => t.id === id);

export type LinkCheck = { ok: true; url: URL } | { ok: false; message: string };

/** Client-side check only (UX). The server must validate again before fetching anything. */
export function checkLink(input: string, tool: Tool): LinkCheck {
  const raw = input.trim();
  if (!raw) return { ok: false, message: 'Collez un lien.' };
  let url: URL;
  try { url = new URL(raw); } catch { return { ok: false, message: 'Ce n’est pas un lien valide.' }; }
  if (url.protocol !== 'https:') return { ok: false, message: 'Le lien doit commencer par https://.' };
  const host = url.hostname.toLowerCase();
  const match = tool.hosts.some((h) => host === h || host.endsWith('.' + h));
  if (!match) return { ok: false, message: `Ce lien ne vient pas de ${tool.name}.` };
  return { ok: true, url };
}
