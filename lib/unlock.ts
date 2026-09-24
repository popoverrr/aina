import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * «Закрытые» объекты: полные детали открываются посетителю только после отправки заявки
 * по этому объекту. Факт заявки хранится в подписанной httpOnly-cookie — подделать без AUTH_SECRET нельзя.
 */
const COOKIE = "ayna_unlock";
const MAX_AGE = 30 * 24 * 60 * 60;

function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

function sign(propertyId: string): string {
  return createHmac("sha256", secret()).update(propertyId).digest("base64url");
}

function verify(propertyId: string, signature: string): boolean {
  const expected = Buffer.from(sign(propertyId));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

type Entry = { id: string; s: string };

function parse(raw: string | undefined): Entry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is Entry =>
        typeof e === "object" && e !== null && typeof (e as Entry).id === "string" && typeof (e as Entry).s === "string",
    );
  } catch {
    return [];
  }
}

export async function isPropertyUnlocked(propertyId: string): Promise<boolean> {
  const store = await cookies();
  const entries = parse(store.get(COOKIE)?.value);
  return entries.some((e) => e.id === propertyId && verify(e.id, e.s));
}

export async function unlockProperty(propertyId: string): Promise<void> {
  const store = await cookies();
  const entries = parse(store.get(COOKIE)?.value).filter((e) => e.id !== propertyId).slice(-20);
  entries.push({ id: propertyId, s: sign(propertyId) });
  store.set({
    name: COOKIE,
    value: JSON.stringify(entries),
    maxAge: MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
