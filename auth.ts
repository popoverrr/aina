import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

// Хеш-«пустышка», чтобы время ответа не зависело от того, совпал ли email.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7lF3v5bE3Wq9ZlE1tYhFxwQfIKb9Cxu";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const adminHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminEmail || !adminHash) {
          console.error("[auth] ADMIN_EMAIL / ADMIN_PASSWORD_HASH не заданы — вход в админку невозможен");
          return null;
        }

        const emailMatches = email === adminEmail;
        const passwordMatches = await bcrypt.compare(password, emailMatches ? adminHash : DUMMY_HASH);

        if (!emailMatches || !passwordMatches) return null;

        return { id: "admin", email: adminEmail, name: "Администратор" };
      },
    }),
  ],
});

/** Сессия администратора или null. Вызывать в начале каждого admin-действия и admin-страницы. */
export async function getAdminSession(): Promise<{ email: string } | null> {
  const session = await auth();
  const email = session?.user?.email;
  return email ? { email } : null;
}
