import { unstable_cache } from "next/cache";

/**
 * Кеш запросов к БД (Next Data Cache) с тегами для инвалидации из админки.
 * Значения кешируются как JSON — поэтому все функции возвращают плоские DTO
 * (числа и ISO-строки), а не объекты Prisma с Decimal/Date.
 *
 * Ошибка БД не роняет страницу: логируется, возвращается fallback (пустой список).
 */
export const TAGS = {
  properties: "properties",
  cases: "cases",
  testimonials: "testimonials",
  settings: "settings",
} as const;

export const REVALIDATE_SECONDS = 60;

export function cachedQuery<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
  tags: string[],
  fallback: R,
): (...args: A) => Promise<R> {
  const cached = unstable_cache(fn, keyParts, { tags, revalidate: REVALIDATE_SECONDS });
  return async (...args: A): Promise<R> => {
    try {
      return await cached(...args);
    } catch (error) {
      console.error(`[db] ${keyParts.join(":")} failed:`, error instanceof Error ? error.message : error);
      return fallback;
    }
  };
}
