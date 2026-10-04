/**
 * Переменные проекта (SPEC.md, раздел 2).
 * Всё, что относится к заказчику, живёт здесь и импортируется отсюда.
 * Ни одна из этих строк не должна быть захардкожена в компонентах.
 *
 * Правило подстановки: незаполненный факт выводится на странице как явная заглушка
 * `[ЗАПОЛНИТЬ: …]`, а не как выдуманное значение. См. isPlaceholder().
 * Необязательные контакты (email, реквизиты) задаются как `undefined` — тогда
 * соответствующие строки на сайте не рендерятся вообще.
 */

export const PLACEHOLDER_MARK = "[ЗАПОЛНИТЬ";

/** Возвращает true, если значение — незаполненная заглушка. */
export function isPlaceholder(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return typeof value === "string" && value.startsWith(PLACEHOLDER_MARK);
}

/** Значение задано и это не заглушка — такие строки можно показывать. */
export function isFilled(value: string | number | null | undefined): value is string | number {
  return !isPlaceholder(value);
}

export const site = {
  agent: {
    fullName: "Айна", // фамилию на сайте не показываем
    shortName: "Айна",
    role: "Коммерческая недвижимость",
    tagline: "Помогаю заехать и зарабатывать", // её собственная формулировка из шапки Instagram
    city: "Алматы",
    /** Число лет на рынке. */
    yearsInMarket: 10 as number | null,
    closedVolume: "более 3 млрд ₸",
    /** Объектов в базе — фиксированное число, а не подсчёт демо-записей в БД. */
    objectsInBase: "60+",
    /** Средний срок сделки — четвёртый показатель полосы цифр на главной. */
    avgDealDuration: "2 недели",
    phone: "+7 701 085 77 17",
    whatsapp: "77010857717",
    /** Готовая ссылка: приглашение по номеру, публичного username нет. */
    telegram: "https://t.me/+77010857717",
    instagram: "ainona.17",
    /** Email не используем — строка контакта не рендерится. */
    email: undefined as string | undefined,
  },
  site: {
    domain: "ainaestate.asia",
    defaultLocale: "ru",
    locales: ["ru"], // "kk" добавится на этапе 2 — см. i18n/routing.ts и messages/kk.json
  },
  /** Подпись разработчика в подвале. Имя компании не переводится. */
  madeBy: {
    label: "Cyber Move Consulting",
    url: "https://cybermove.asia",
  },
  legal: {
    /** Реквизиты ИП/ТОО не показываем — блок не рендерится. */
    entity: undefined as string | undefined,
    /** Оператор персональных данных для политики конфиденциальности. */
    operator: "Айна, частное лицо, г. Алматы",
  },
  analytics: {
    ga4: process.env.NEXT_PUBLIC_GA4_ID,
    metrika: process.env.NEXT_PUBLIC_METRIKA_ID,
  },
} as const;

export type SiteConfig = typeof site;

/**
 * Публичный адрес сайта для canonical/sitemap/OG.
 * Пока домен не куплен и не привязан, адрес задаётся переменной NEXT_PUBLIC_SITE_URL
 * (локально — localhost, превью — GitHub Pages); домен из конфига используется как запасной.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (isFilled(site.site.domain)) return `https://${site.site.domain}`;
  return "http://localhost:3000";
}

/** Ссылка на WhatsApp с готовым текстом. */
export function whatsappLink(text?: string): string {
  const base = `https://wa.me/${site.agent.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * В конфиге и в настройках админки может лежать как готовая ссылка (`https://t.me/+7700...`),
 * так и просто username — принимаем оба варианта.
 */
export function telegramLink(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://t.me/${value.replace(/^@/, "")}`;
}

/** Username для показа в интерфейсе или null, если ссылка по номеру телефона. */
export function telegramHandle(value: string): string | null {
  const name = value.replace(/^https?:\/\/(?:t\.me|telegram\.me)\//i, "").replace(/^@/, "").replace(/\/$/, "");
  return /^[A-Za-z][A-Za-z0-9_]{3,}$/.test(name) ? name : null;
}

export function instagramLink(username: string): string {
  return `https://instagram.com/${username.replace(/^@/, "")}`;
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
