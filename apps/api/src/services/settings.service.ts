import { z } from 'zod';
import type { Repos } from '../repositories/types.js';

const tools = z.object({ tiktok: z.boolean(), instagram: z.boolean(), facebook: z.boolean(), music: z.boolean() }).strict();
const ads = z.object({ enabled: z.boolean(), waitSeconds: z.number().int().min(0).max(30), homeSlotEnabled: z.boolean() }).strict();
export const settingsShape = { tools, ads };
export type Settings = { tools: z.infer<typeof tools>; ads: z.infer<typeof ads> };

export const DEFAULT_SETTINGS: Settings = {
  tools: { tiktok: true, instagram: true, facebook: true, music: true },
  // Ads are OFF until an administrator turns them on (and a front-end ad provider is wired).
  ads: { enabled: false, waitSeconds: 5, homeSlotEnabled: false },
};

export const settingsPatchSchema = z.object({ tools: tools.partial().optional(), ads: ads.partial().optional() }).strict()
  .refine((v) => v.tools !== undefined || v.ads !== undefined, 'Nothing to update');

export function createSettingsService(repos: Repos, now: () => Date = () => new Date()) {
  let cache: { at: number; value: Settings } | null = null;
  const TTL = 5_000;

  async function load(): Promise<Settings> {
    const raw = await repos.settings.getAll();
    const t = tools.safeParse({ ...DEFAULT_SETTINGS.tools, ...(raw.tools as object | undefined) });
    const a = ads.safeParse({ ...DEFAULT_SETTINGS.ads, ...(raw.ads as object | undefined) });
    return { tools: t.success ? t.data : DEFAULT_SETTINGS.tools, ads: a.success ? a.data : DEFAULT_SETTINGS.ads };
  }
  return {
    async get(): Promise<Settings> {
      if (cache && now().getTime() - cache.at < TTL) return cache.value;
      const value = await load();
      cache = { at: now().getTime(), value };
      return value;
    },
    async update(actorId: string, patch: z.infer<typeof settingsPatchSchema>): Promise<Settings> {
      const cur = await load();
      const next: Settings = { tools: { ...cur.tools, ...patch.tools }, ads: { ...cur.ads, ...patch.ads } };
      const changed: string[] = [];
      for (const k of ['tools', 'ads'] as const) {
        if (patch[k] !== undefined) { await repos.settings.set(k, next[k], actorId); changed.push(k); }
      }
      await repos.audit.create({ actorId, action: 'ADMIN_SETTINGS_CHANGED', metadata: { keys: changed.join(',') } });
      cache = null;
      return next;
    },
    /** What the public front-end may know. */
    async publicView() {
      const s = await this.get();
      return { tools: s.tools, ads: { enabled: s.ads.enabled, waitSeconds: s.ads.waitSeconds, homeSlotEnabled: s.ads.homeSlotEnabled } };
    },
  };
}
export type SettingsService = ReturnType<typeof createSettingsService>;
