import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";
import { applyUtmCookies } from "@/lib/utm";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createIntlMiddleware(routing);

const localePrefix = `(?:/(?:${routing.locales.join("|")}))?`;
const ADMIN_RE = new RegExp(`^${localePrefix}/admin(?:/|$)`);
const ADMIN_PUBLIC_RE = new RegExp(`^${localePrefix}/admin(?:/login)?/?$`);

/** Защищённые страницы админки: сессию проверяет Auth.js, без сессии — на страницу входа. */
const adminProxy = auth((request) => {
  if (!request.auth?.user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(loginUrl);
  }
  return handleI18nRouting(request);
});

/**
 * Порядок: 1) защита /admin (кроме входа) через Auth.js, 2) маршрутизация локалей next-intl,
 * 3) first-touch UTM-cookie на публичных страницах. Server Actions под /admin проверяют сессию сами.
 * Auth.js подключается только к /admin — публичные страницы не получают его служебных cookie.
 */
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (ADMIN_RE.test(pathname) && !ADMIN_PUBLIC_RE.test(pathname)) {
    // Auth.js типизирует обёртку как route handler; в proxy вторым аргументом приходит NextFetchEvent.
    return adminProxy(request, event as unknown as Parameters<typeof adminProxy>[1]);
  }

  const response = handleI18nRouting(request);
  applyUtmCookies(request, response);
  return response;
}

export const config = {
  // Всё, кроме API, служебных путей Next, файлов с расширением (картинки, sitemap.xml, robots.txt)
  // и динамических OG-картинок (их URL уже содержит локаль: /ru/objects/…/opengraph-image-…).
  matcher: ["/((?!api|_next|_vercel|.*\\..*|.*/opengraph-image).*)"],
};
