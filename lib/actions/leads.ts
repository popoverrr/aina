"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing, toAppLocale, type AppLocale } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import { formatArea, formatDate, normalizePhone } from "@/lib/format";
import { districtBySlug } from "@/lib/districts";
import { appendLeadToSheet } from "@/lib/notify/sheets";
import { sendTelegramNotification, type LeadNotification } from "@/lib/notify/telegram";
import { checkRateLimit } from "@/lib/rate-limit";
import { unlockProperty } from "@/lib/unlock";
import { parseUtmCookie, UTM_COOKIE } from "@/lib/utm";
import { flattenFieldErrors, parseLead, type LeadActionResult } from "@/lib/validation/lead";
import type { LeadType, Prisma } from "@/lib/generated/prisma/client";

const MIN_FILL_MS = 2000;
const NOTIFY_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

function thanksPath(locale: AppLocale, type: LeadType): string {
  const href = { pathname: "/thanks", query: { type } } as const;
  return getPathname({ href, locale });
}

/**
 * Единая точка приёма всех форм сайта (SPEC.md, раздел 6).
 * 1) zod → 2) UTM/pagePath/referrer → 3) Lead в БД (критично) → 4) Telegram → 5) Sheets
 * (не критичны, ≤ 3 с) → 6) событие аналитики отправляет страница /thanks → 7) redirect.
 */
export async function submitLead(input: unknown, localeInput: string = routing.defaultLocale): Promise<LeadActionResult> {
  const locale = toAppLocale(localeInput);
  const parsed = parseLead(input);
  if (!parsed.success) {
    const fieldErrors = flattenFieldErrors(parsed.error);
    // honeypot заполнен — это бот; делаем вид, что всё прошло, ничего не сохраняем
    if (fieldErrors.website === "spam") redirect(thanksPath(locale, "CONTACT"));
    return { ok: false, fieldErrors };
  }

  const data = parsed.data;

  // Заполнено быстрее 2 секунд — бот. Тихий «успех» без записи.
  if (data.startedAt > 0 && Date.now() - data.startedAt < MIN_FILL_MS) {
    redirect(thanksPath(locale, data.type));
  }

  const ip = await clientIp();
  const limit = checkRateLimit(ip);
  if (!limit.allowed) return { ok: false, formError: "rateLimit" };

  const cookieStore = await cookies();
  const utm = parseUtmCookie(cookieStore.get(UTM_COOKIE)?.value);
  const h = await headers();
  const referer = h.get("referer");
  const pagePath = data.pagePath ?? (referer ? safePath(referer) : undefined);
  const phone = normalizePhone(data.phone) ?? data.phone;

  // ---- 3. Запись в БД — критический шаг ----
  const create: Prisma.LeadCreateInput = {
    type: data.type,
    name: data.name,
    phone,
    utmSource: utm?.source,
    utmMedium: utm?.medium,
    utmCampaign: utm?.campaign,
    utmContent: utm?.content,
    pagePath,
    referrer: utm?.referrer,
  };

  let propertyLabel: string | undefined;
  let briefLabel: string | undefined;

  if (data.type === "SEARCH") {
    const districts = data.briefDistricts.map((s) => districtBySlug(s)?.name ?? s);
    create.briefKind = data.briefKind || undefined;
    create.briefAreaFrom = data.briefAreaFrom;
    create.briefAreaTo = data.briefAreaTo;
    create.briefBudget = data.briefBudget || undefined;
    create.briefDistricts = districts;
    create.briefBusiness = data.briefBusiness || undefined;
    create.comment = data.dealType ? (data.dealType === "RENT" ? "Сделка: аренда" : "Сделка: покупка") : undefined;
    briefLabel = await describeBrief(locale, {
      kind: data.briefKind || undefined,
      deal: data.dealType || undefined,
      areaFrom: data.briefAreaFrom,
      areaTo: data.briefAreaTo,
      budget: data.briefBudget || undefined,
      districts,
      business: data.briefBusiness || undefined,
    });
  } else if (data.type === "OWNER") {
    const district = data.district ? districtBySlug(data.district)?.name ?? data.district : undefined;
    create.briefKind = data.briefKind || undefined;
    create.briefDistricts = district ? [district] : [];
    create.briefAreaFrom = data.briefAreaFrom;
    create.comment = data.comment || undefined;
    briefLabel = await describeBrief(locale, {
      kind: data.briefKind || undefined,
      areaFrom: data.briefAreaFrom,
      districts: district ? [district] : [],
    });
  } else {
    create.comment = data.comment || undefined;
    if (data.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
        select: { id: true, kind: true, areaM2: true, district: true, slug: true },
      });
      if (property) {
        create.property = { connect: { id: property.id } };
        const tEnums = await getTranslations({ locale, namespace: "enums" });
        propertyLabel = `${tEnums(`kind.${property.kind}`)} ${formatArea(property.areaM2)}, ${property.district}`;
      }
    }
  }

  let leadId: string;
  try {
    const lead = await prisma.lead.create({ data: create, select: { id: true, propertyId: true } });
    leadId = lead.id;
    if (lead.propertyId && (data.type === "OBJECT" || data.type === "PRESENTATION")) {
      await unlockProperty(lead.propertyId);
    }
  } catch (error) {
    console.error("[lead] DB write failed:", error);
    return { ok: false, formError: "dbError" };
  }

  // ---- 4–5. Уведомления — не критичны, ограничены таймаутом ----
  const tLead = await getTranslations({ locale, namespace: "enums" });
  const typeLabel = tLead(`leadType.${data.type}`);
  const notification: LeadNotification = {
    typeLabel,
    name: data.name,
    phone,
    objectLabel: propertyLabel,
    comment: create.comment ?? undefined,
    brief: briefLabel,
    utmSource: utm?.source,
    utmMedium: utm?.medium,
    utmCampaign: utm?.campaign,
    pagePath,
  };

  const results = await Promise.allSettled([
    withTimeout(sendTelegramNotification(notification), NOTIFY_TIMEOUT_MS),
    withTimeout(
      appendLeadToSheet({
        date: formatDate(new Date(), true),
        typeLabel,
        name: data.name,
        phone,
        objectLabel: propertyLabel ?? "",
        comment: [briefLabel, create.comment].filter(Boolean).join(" · "),
        utmSource: utm?.source ?? "",
        utmCampaign: utm?.campaign ?? "",
        pagePath: pagePath ?? "",
      }),
      NOTIFY_TIMEOUT_MS,
    ),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[lead ${leadId}] ${i === 0 ? "telegram" : "sheets"} failed:`, r.reason);
  });

  // ---- 6. Событие аналитики уходит со страницы /thanks (client-side gtag/ym) ----
  // ---- 7. Редирект ----
  redirect(thanksPath(locale, data.type));
}

function safePath(url: string): string | undefined {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}`.slice(0, 300);
  } catch {
    return undefined;
  }
}

async function describeBrief(
  locale: AppLocale,
  b: { kind?: string; deal?: "RENT" | "SALE"; areaFrom?: number; areaTo?: number; budget?: string; districts: string[]; business?: string },
): Promise<string | undefined> {
  const t = await getTranslations({ locale, namespace: "enums" });
  const parts: string[] = [];
  if (b.kind) parts.push(t(`kind.${b.kind as "RETAIL"}`));
  if (b.deal) parts.push(t(`dealShort.${b.deal}`));
  if (b.areaFrom !== undefined || b.areaTo !== undefined) {
    parts.push(`${b.areaFrom !== undefined ? `от ${b.areaFrom}` : ""} ${b.areaTo !== undefined ? `до ${b.areaTo}` : ""} м²`.trim());
  }
  if (b.budget) parts.push(`бюджет: ${b.budget}`);
  if (b.districts.length) parts.push(b.districts.join(", "));
  if (b.business) parts.push(b.business);
  return parts.length ? parts.join(" · ") : undefined;
}
