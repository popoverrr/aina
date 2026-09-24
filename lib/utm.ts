import type { NextRequest, NextResponse } from "next/server";

/**
 * First-touch атрибуция: utm_* из query первого визита кладутся в cookie на 90 дней
 * и НЕ перезаписываются при повторных визитах с другими метками.
 * Модуль не импортирует Prisma — используется в proxy.ts.
 */
export const UTM_COOKIE = "ayna_utm";
export const UTM_COOKIE_MAX_AGE = 90 * 24 * 60 * 60;

export interface UtmData {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  /** Внешний referrer первого визита */
  referrer?: string;
  /** Страница входа первого визита */
  landing?: string;
  ts?: number;
}

const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;

function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  const v = value.trim().slice(0, 200);
  return v || undefined;
}

export function parseUtmFromSearch(params: URLSearchParams): UtmData | null {
  const data: UtmData = {};
  let found = false;
  for (const key of UTM_KEYS) {
    const v = clean(params.get(`utm_${key}`));
    if (v) {
      data[key] = v;
      found = true;
    }
  }
  return found ? data : null;
}

export function serializeUtm(data: UtmData): string {
  return encodeURIComponent(JSON.stringify(data));
}

export function parseUtmCookie(raw: string | undefined): UtmData | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== "object" || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    const out: UtmData = {};
    for (const key of [...UTM_KEYS, "referrer", "landing"] as const) {
      const v = obj[key];
      if (typeof v === "string") out[key] = v.slice(0, 200);
    }
    if (typeof obj.ts === "number") out.ts = obj.ts;
    return out;
  } catch {
    return null;
  }
}

function isExternalReferrer(referrer: string | null, host: string | null): string | undefined {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    if (host && url.host === host) return undefined;
    return url.origin.slice(0, 200);
  } catch {
    return undefined;
  }
}

/** Вызывается из proxy.ts: ставит cookie только если её ещё нет и есть что сохранять. */
export function applyUtmCookies(request: NextRequest, response: NextResponse): void {
  if (request.cookies.has(UTM_COOKIE)) return;

  const utm = parseUtmFromSearch(request.nextUrl.searchParams);
  const referrer = isExternalReferrer(request.headers.get("referer"), request.headers.get("host"));
  if (!utm && !referrer) return;

  const data: UtmData = {
    ...(utm ?? {}),
    referrer,
    landing: request.nextUrl.pathname.slice(0, 200),
    ts: Date.now(),
  };

  response.cookies.set({
    name: UTM_COOKIE,
    value: serializeUtm(data),
    maxAge: UTM_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
