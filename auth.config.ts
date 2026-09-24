import type { NextAuthConfig } from "next-auth";

/**
 * Часть конфигурации Auth.js без провайдеров и bcrypt — её импортирует proxy.ts.
 * Один администратор, JWT-сессия на 7 дней, никакой регистрации.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  trustHost: true,
  providers: [],
} satisfies NextAuthConfig;
