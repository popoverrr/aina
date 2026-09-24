import "server-only";
import { prisma } from "@/lib/db";
import { cachedQuery, TAGS } from "@/lib/cache";
import { site } from "@/site.config";

/**
 * Настройки, редактируемые в /admin/settings через модель Setting (key → JSON).
 * Пустое значение означает «взять по умолчанию» из словаря или site.config.ts.
 */
export interface SiteSettings {
  hero: { title?: string; subtitle?: string };
  stats: { years?: string; volume?: string; objects?: string; avgDeal?: string };
  contacts: { phone?: string; whatsapp?: string; telegram?: string; instagram?: string; email?: string };
  golden: { text?: string };
}

export const SETTING_KEYS = ["hero", "stats", "contacts", "golden"] as const satisfies ReadonlyArray<keyof SiteSettings>;

const EMPTY: SiteSettings = { hero: {}, stats: {}, contacts: {}, golden: {} };

function cleanGroup(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return out;
}

export const getSiteSettings = cachedQuery(
  async (): Promise<SiteSettings> => {
    const rows = await prisma.setting.findMany({ where: { key: { in: [...SETTING_KEYS] } } });
    const result: SiteSettings = { hero: {}, stats: {}, contacts: {}, golden: {} };
    for (const row of rows) {
      const group = cleanGroup(row.value);
      switch (row.key) {
        case "hero":
          result.hero = group;
          break;
        case "stats":
          result.stats = group;
          break;
        case "contacts":
          result.contacts = group;
          break;
        case "golden":
          result.golden = group;
          break;
      }
    }
    return result;
  },
  ["site-settings"],
  [TAGS.settings],
  EMPTY,
);

export interface Contacts {
  phone: string;
  whatsapp: string;
  telegram: string;
  instagram: string;
  email: string;
}

/** Контакты: настройки из админки поверх site.config.ts. */
export async function getContacts(): Promise<Contacts> {
  const s = await getSiteSettings();
  return {
    phone: s.contacts.phone ?? site.agent.phone,
    whatsapp: s.contacts.whatsapp ?? site.agent.whatsapp,
    telegram: s.contacts.telegram ?? site.agent.telegram,
    instagram: s.contacts.instagram ?? site.agent.instagram,
    email: s.contacts.email ?? site.agent.email,
  };
}
