import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "./routing";

type Messages = Record<string, unknown>;

async function loadMessages(locale: string): Promise<Messages> {
  const mod: { default: Messages } = await import(`../messages/${locale}.json`);
  return mod.default;
}

/** Глубокое слияние: ключи локали перекрывают ключи ru — незаполненные строки не ломают страницу. */
function deepMerge(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    if (isRecord(current) && isRecord(value)) {
      result[key] = deepMerge(current, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function isRecord(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function resolveLocale(explicit: string | undefined): Promise<AppLocale> {
  if (explicit && hasLocale(routing.locales, explicit)) return explicit;
  try {
    // next/root-params недоступен в Server Actions и Route Handlers — там берём локаль по умолчанию.
    const fromParams = await rootParams.locale();
    if (hasLocale(routing.locales, fromParams)) return fromParams;
  } catch {
    // ignore — fallback below
  }
  return routing.defaultLocale;
}

export default getRequestConfig(async ({ locale }) => {
  const resolved = await resolveLocale(locale);
  const base = await loadMessages(routing.defaultLocale);
  const messages = resolved === routing.defaultLocale ? base : deepMerge(base, await loadMessages(resolved));

  return {
    locale: resolved,
    messages,
    timeZone: "Asia/Almaty",
  };
});
