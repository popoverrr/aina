/**
 * Переменные проекта (SPEC.md, раздел 2).
 * Всё, что относится к заказчику, живёт здесь и импортируется отсюда.
 * Ни одна из этих строк не должна быть захардкожена в компонентах.
 *
 * Правило подстановки: незаполненный факт выводится на странице как явная заглушка
 * `[ЗАПОЛНИТЬ: …]`, а не как выдуманное значение. См. isPlaceholder().
 */

export const PLACEHOLDER_MARK = "[ЗАПОЛНИТЬ";

/** Возвращает true, если значение — незаполненная заглушка. */
export function isPlaceholder(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return typeof value === "string" && value.startsWith(PLACEHOLDER_MARK);
}

export const site = {
  agent: {
    fullName: "Айна [ЗАПОЛНИТЬ: фамилия]",
    shortName: "Айна",
    role: "Коммерческая недвижимость",
    tagline: "Помогаю заехать и зарабатывать", // её собственная формулировка из шапки Instagram
    city: "Алматы",
    /** Число лет на рынке. null — пока не заполнено. */
    yearsInMarket: null as number | null,
    closedVolume: "[ЗАПОЛНИТЬ: объём закрытых сделок, например «более 3 млрд ₸»]",
    /** Средний срок сделки — четвёртый показатель полосы цифр на главной. */
    avgDealDuration: "[ЗАПОЛНИТЬ: средний срок сделки, например «1,5 месяца»]",
    phone: "+7 701 085 77 17",
    whatsapp: "77010857717",
    telegram: "[ЗАПОЛНИТЬ: username в Telegram]",
    instagram: "ainona.17",
    email: "[ЗАПОЛНИТЬ: email]",
  },
  site: {
    domain: "[ЗАПОЛНИТЬ: домен.kz]",
    defaultLocale: "ru",
    locales: ["ru"], // "kk" добавится на этапе 2 — см. i18n/routing.ts и messages/kk.json
  },
  legal: {
    entity: "[ЗАПОЛНИТЬ: ИП / ТОО, БИН/ИИН]",
  },
  analytics: {
    ga4: process.env.NEXT_PUBLIC_GA4_ID,
    metrika: process.env.NEXT_PUBLIC_METRIKA_ID,
  },
} as const;

export type SiteConfig = typeof site;

/** Публичный адрес сайта для canonical/sitemap/OG. */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (!isPlaceholder(site.site.domain)) return `https://${site.site.domain}`;
  return "http://localhost:3000";
}

/** Ссылка на WhatsApp с готовым текстом. */
export function whatsappLink(text?: string): string {
  const base = `https://wa.me/${site.agent.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telegramLink(username: string): string {
  return `https://t.me/${username.replace(/^@/, "")}`;
}

export function instagramLink(username: string): string {
  return `https://instagram.com/${username.replace(/^@/, "")}`;
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
