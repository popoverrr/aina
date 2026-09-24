"use client";

import { useTranslations } from "next-intl";

const KEYS = ["titleRequired", "slugInvalid", "slugTaken", "districtRequired", "areaRequired", "number", "url", "unauthorized", "storageNotConfigured", "unknown"] as const;
type Key = (typeof KEYS)[number];

/** Ключ ошибки из zod/Server Action → текст. Неизвестный ключ показываем как есть. */
export function useAdminErrors() {
  const t = useTranslations("admin.objects.errors");
  return (key: string | undefined): string | undefined => {
    if (!key) return undefined;
    return (KEYS as readonly string[]).includes(key) ? t(key as Key) : key;
  };
}
