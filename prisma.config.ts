import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 не читает .env сам. Порядок: .env.local (локальные секреты) перекрывает .env.
loadEnv({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Пустая строка вместо исключения: `prisma generate` (в т.ч. на CI/Vercel без БД)
    // не должен падать. Команды, которым нужна БД, сообщат об отсутствии URL сами.
    url: process.env.DATABASE_URL ?? "",
  },
});
