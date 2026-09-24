/**
 * Rate limit по IP: 5 отправок за 10 минут (SPEC.md, раздел 6).
 * Хранилище — память процесса. На Vercel каждый инстанс считает отдельно; для MVP этого достаточно,
 * при росте нагрузки заменить на Upstash/Redis, не меняя сигнатуру.
 */
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const since = now - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((t) => t > since);

  if (recent.length >= LIMIT) {
    const oldest = recent[0] ?? now;
    return { allowed: false, retryAfterSec: Math.ceil((oldest + WINDOW_MS - now) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  // не даём карте расти бесконечно
  if (hits.size > 5000) {
    for (const [k, list] of hits) {
      if (list.every((t) => t <= since)) hits.delete(k);
    }
  }

  return { allowed: true, retryAfterSec: 0 };
}
