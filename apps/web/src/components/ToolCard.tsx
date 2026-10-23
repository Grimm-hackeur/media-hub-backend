import { Link } from 'react-router-dom';
import { Camera, MonitorPlay, Music2, Smartphone, type LucideIcon } from 'lucide-react';
import type { Tool, ToolId } from '../features/tools';

export const TOOL_ICON: Record<ToolId, LucideIcon> = { tiktok: Smartphone, instagram: Camera, facebook: MonitorPlay, music: Music2 };

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = TOOL_ICON[tool.id];
  return (
    <Link to={`/outils/${tool.id}`} className="flex h-28 flex-col justify-between bg-bg p-4 transition-colors hover:bg-panel md:h-36 md:p-5">
      <Icon size={22} strokeWidth={1.75} aria-hidden />
      <span><span className="block text-[15px] font-medium">{tool.name}</span><span className="block text-[13px] text-muted">{tool.tagline}</span></span>
    </Link>
  );
}
