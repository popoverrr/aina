import { z } from "zod";
import { DISTRICT_NAMES } from "@/lib/districts";
import { DEAL_TYPES, LEAD_STATUSES, PROP_KINDS, PROP_STATUSES } from "@/lib/enums";
import { isValidSlug } from "@/lib/slug";

export { LEAD_STATUSES, PROP_STATUSES };

/**
 * Схемы админки. Одна схема — и в react-hook-form, и в Server Action.
 * Клиент отправляет на сервер уже преобразованные значения (после zod-трансформаций), поэтому
 * каждая схема принимает и «сырой» ввод формы (строки, ""), и собственный результат (null, number, Date).
 * Пустая строка в необязательном поле означает null (очистить в БД).
 */

const optStr = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

function toNumber(v: string | number): number {
  return typeof v === "number" ? v : Number(String(v).replace(/\s/g, "").replace(",", "."));
}

const optNum = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === "") return null;
    const n = toNumber(v);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "number" });
      return z.NEVER;
    }
    return n;
  });

const reqNum = (message: string) =>
  z.union([z.string(), z.number()]).transform((v, ctx) => {
    const n = v === "" ? Number.NaN : toNumber(v);
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return n;
  });

const bool = z.boolean().default(false);

const optUrl = z
  .string()
  .trim()
  .nullish()
  .transform((v, ctx) => {
    if (!v) return null;
    try {
      const u = new URL(v);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
      return v;
    } catch {
      ctx.addIssue({ code: "custom", message: "url" });
      return z.NEVER;
    }
  });

const optDate = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === "") return null;
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "number" });
      return z.NEVER;
    }
    return d;
  });

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => isValidSlug(v), { error: "slugInvalid" });

/** Список строк из textarea: по одному пункту на строку (или уже готовый массив). */
const lines = (max: number) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      const arr = Array.isArray(v) ? v : (v ?? "").split(/\r?\n/);
      return arr.map((s) => s.trim()).filter(Boolean).slice(0, max);
    });

export const propertySchema = z.object({
  title: z.string().trim().min(2, { error: "titleRequired" }).max(200),
  slug: slugField,
  externalId: optStr(64),
  kind: z.enum(PROP_KINDS),
  dealType: z.enum(DEAL_TYPES),
  status: z.enum(PROP_STATUSES),
  district: z.string().refine((v) => DISTRICT_NAMES.includes(v), { error: "districtRequired" }),
  address: optStr(200),
  landmark: optStr(200),
  lat: optNum,
  lng: optNum,
  areaM2: reqNum("areaRequired"),
  ceilingM: optNum,
  floor: optStr(40),
  entrance: optStr(120),
  powerKw: optNum,
  hasWetPoint: bool,
  priceSale: optNum,
  priceRentM2: optNum,
  priceRentTotal: optNum,
  utilitiesIncluded: bool,
  isExclusive: bool,
  isHot: bool,
  isFeatured: bool,
  descriptionMd: z.string().trim().max(20000).default(""),
  advantages: lines(8),
  presentationUrl: optUrl,
  publishedAt: optDate,
});
export type PropertyFormInput = z.input<typeof propertySchema>;
export type PropertyFormValues = z.output<typeof propertySchema>;

export const caseSchema = z.object({
  title: z.string().trim().min(2, { error: "titleRequired" }).max(200),
  slug: slugField,
  kind: z.enum(PROP_KINDS),
  dealType: z.enum(DEAL_TYPES),
  district: optStr(60),
  areaM2: optNum,
  amountLabel: optStr(120),
  durationLabel: optStr(60),
  task: z.string().trim().min(1, { error: "titleRequired" }).max(5000),
  solution: z.string().trim().min(1, { error: "titleRequired" }).max(5000),
  result: z.string().trim().min(1, { error: "titleRequired" }).max(5000),
  isFeatured: bool,
  order: optNum.transform((v) => v ?? 0),
});
export type CaseFormInput = z.input<typeof caseSchema>;
export type CaseFormValues = z.output<typeof caseSchema>;

export const testimonialSchema = z.object({
  author: z.string().trim().min(1, { error: "titleRequired" }).max(120),
  role: optStr(160),
  text: z.string().trim().min(1, { error: "titleRequired" }).max(3000),
  order: optNum.transform((v) => v ?? 0),
  isPublic: z.boolean().default(true),
});
export type TestimonialFormInput = z.input<typeof testimonialSchema>;
export type TestimonialFormValues = z.output<typeof testimonialSchema>;

const settingStr = z.string().trim().max(2000).optional().default("");

export const settingsSchema = z.object({
  hero: z.object({ title: settingStr, subtitle: settingStr }),
  stats: z.object({ years: settingStr, volume: settingStr, objects: settingStr, avgDeal: settingStr }),
  contacts: z.object({ phone: settingStr, whatsapp: settingStr, telegram: settingStr, instagram: settingStr, email: settingStr }),
  golden: z.object({ text: z.string().trim().max(10000).optional().default("") }),
});
export type SettingsFormInput = z.input<typeof settingsSchema>;
export type SettingsFormValues = z.output<typeof settingsSchema>;

export type AdminActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string> };
