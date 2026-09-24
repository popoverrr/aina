import * as z from "zod/mini";
import { LEAD_TYPES, PROP_KINDS } from "@/lib/enums";
import { normalizePhone } from "@/lib/format";

export { DEAL_TYPES, LEAD_TYPES, PROP_KINDS } from "@/lib/enums";

/**
 * Единые zod-схемы заявок: используются и в react-hook-form (клиент), и в Server Actions (сервер).
 * Написаны на `zod/mini` — это тот же zod 4, но tree-shakeable: в браузер уезжает ~10 KB вместо ~90.
 * Обязательные поля везде — только имя и телефон. Сообщения ошибок — ключи словаря forms.errors.
 */

export const phoneSchema = z
  .string({ error: "phoneRequired" })
  .check(
    z.trim(),
    z.minLength(1, { error: "phoneRequired" }),
    z.refine((v) => normalizePhone(v) !== null, { error: "phoneInvalid" }),
    // Казахстан: +7 и 10 цифр. Международные допускаем: + и 10–15 цифр.
    z.refine(
      (v) => {
        const n = normalizePhone(v);
        return n !== null && (/^\+7\d{10}$/.test(n) || /^\+\d{10,15}$/.test(n));
      },
      { error: "phoneInvalid" },
    ),
  );

export const nameSchema = z
  .string({ error: "nameRequired" })
  .check(z.trim(), z.minLength(2, { error: "nameTooShort" }), z.maxLength(80, { error: "nameTooLong" }));

const optionalText = (max: number) => z.optional(z.string().check(z.trim(), z.maxLength(max, { error: "commentTooLong" })));

/** Технические поля антиспама, одинаковые для всех форм. */
const antiSpamFields = {
  /** honeypot: настоящие пользователи поле не видят и не заполняют */
  website: z.optional(z.string().check(z.maxLength(0, { error: "spam" }))),
  /** момент открытия формы (Date.now() на клиенте) — заполнение быстрее 2 с считаем ботом */
  startedAt: z.catch(z.coerce.number().check(z.int(), z.nonnegative()), 0),
  /** путь страницы, с которой отправлена форма */
  pagePath: z.optional(z.string().check(z.maxLength(300))),
};

const optionalNumber = z.pipe(
  z.optional(z.union([z.string(), z.number()])),
  z.transform((v) => {
    if (v === undefined || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(String(v).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }),
);

export const contactLeadSchema = z.object({
  type: z.enum(["CONTACT", "OBJECT", "PRESENTATION"]),
  name: nameSchema,
  phone: phoneSchema,
  comment: optionalText(2000),
  propertyId: z.optional(z.string().check(z.maxLength(64))),
  ...antiSpamFields,
});
export type ContactLeadInput = z.input<typeof contactLeadSchema>;
export type ContactLeadValues = z.output<typeof contactLeadSchema>;

export const searchBriefSchema = z.object({
  type: z.literal("SEARCH"),
  briefKind: z.optional(z.union([z.enum(PROP_KINDS), z.literal("")])),
  dealType: z.optional(z.union([z.enum(["RENT", "SALE"]), z.literal("")])),
  briefAreaFrom: optionalNumber,
  briefAreaTo: optionalNumber,
  briefBudget: optionalText(120),
  // react-hook-form отдаёт для группы чекбоксов массив, для одного — строку, для пустой — false
  briefDistricts: z.pipe(
    z.pipe(
      z.unknown(),
      z.transform((v): string[] => {
        if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
        return typeof v === "string" && v ? [v] : [];
      }),
    ),
    z.array(z.string().check(z.maxLength(40))).check(z.maxLength(8)),
  ),
  briefBusiness: optionalText(1000),
  name: nameSchema,
  phone: phoneSchema,
  ...antiSpamFields,
});
export type SearchBriefInput = z.input<typeof searchBriefSchema>;
export type SearchBriefValues = z.output<typeof searchBriefSchema>;

export const ownerLeadSchema = z.object({
  type: z.literal("OWNER"),
  name: nameSchema,
  phone: phoneSchema,
  briefKind: z.optional(z.union([z.enum(PROP_KINDS), z.literal("")])),
  district: z.optional(z.string().check(z.maxLength(40))),
  briefAreaFrom: optionalNumber,
  comment: optionalText(2000),
  ...antiSpamFields,
});
export type OwnerLeadInput = z.input<typeof ownerLeadSchema>;
export type OwnerLeadValues = z.output<typeof ownerLeadSchema>;

export type AnyLeadValues = ContactLeadValues | SearchBriefValues | OwnerLeadValues;

/** Минимальная форма ошибки валидации — общая для zod/mini и классического zod. */
export interface ValidationIssues {
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>;
}

export type ParseResult<T> = { success: true; data: T } | { success: false; error: ValidationIssues };

const typeOnly = z.object({ type: z.enum(LEAD_TYPES) });

/** Разбор заявки любого типа: сначала тип, затем схема этого типа. */
export function parseLead(input: unknown): ParseResult<AnyLeadValues> {
  const head = typeOnly.safeParse(input);
  if (!head.success) return { success: false, error: head.error };
  switch (head.data.type) {
    case "SEARCH":
      return searchBriefSchema.safeParse(input);
    case "OWNER":
      return ownerLeadSchema.safeParse(input);
    default:
      return contactLeadSchema.safeParse(input);
  }
}

/** Результат Server Action: либо redirect (промис не резолвится), либо ошибки. */
export type LeadActionResult = { ok: true } | { ok: false; formError?: string; fieldErrors?: Record<string, string> };

/** Плоский словарь ошибок полей из результата валидации. */
export function flattenFieldErrors(error: ValidationIssues): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
