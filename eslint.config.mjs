import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Сгенерированный Prisma-клиент, локальная БД, снимок превью и временные скрипты
    "lib/generated/**",
    ".pgdata/**",
    ".tmp/**",
    "out-preview/**",
  ]),
]);

export default eslintConfig;
