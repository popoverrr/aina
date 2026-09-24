import { defineRouting } from "next-intl/routing";
import { site } from "@/site.config";

/**
 * Маршрутизация локалей. `ru` без префикса (/objects), остальные — с префиксом (/kk/objects).
 * Чтобы включить казахскую версию: добавить "kk" в site.site.locales и заполнить messages/kk.json.
 */
export const routing = defineRouting({
  locales: site.site.locales,
  defaultLocale: site.site.defaultLocale,
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];

/** Строка из URL/параметров → поддерживаемая локаль (иначе локаль по умолчанию). */
export function toAppLocale(value: string | undefined): AppLocale {
  return (routing.locales as readonly string[]).includes(value ?? "") ? (value as AppLocale) : routing.defaultLocale;
}
