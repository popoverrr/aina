import type { Messages } from "next-intl";

/**
 * Клиентским компонентам нужны не все словари: в публичный layout уходит подмножество без
 * админки и длинных серверных текстов, в админку — только её namespace'ы.
 * Это уменьшает HTML/RSC-payload каждой страницы.
 */
// Публичные клиентские компоненты со словарями: формы заявок (forms, enums, search), error.tsx (common).
export const SITE_MESSAGE_KEYS = ["common", "enums", "forms", "search"] as const satisfies ReadonlyArray<keyof Messages>;
export const ADMIN_MESSAGE_KEYS = ["common", "enums", "admin"] as const satisfies ReadonlyArray<keyof Messages>;

export function pickMessages<K extends keyof Messages>(messages: Messages, keys: readonly K[]): Pick<Messages, K> {
  const out = {} as Pick<Messages, K>;
  for (const key of keys) out[key] = messages[key];
  return out;
}
