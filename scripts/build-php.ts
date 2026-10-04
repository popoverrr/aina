/**
 * Сборка PHP-версии сайта в dist/.
 *
 * Эта версия работает на обычном хостинге с PHP и SQLite (Node.js там запустить нельзя),
 * поэтому разметка и логика живут в hosting/, а данные заказчика берутся из тех же
 * источников, что и у Next-версии: site.config.ts, messages/ru.json и prisma/seed.ts.
 * Скрипт выгружает их в JSON, собирает CSS из того же globals.css и складывает всё в dist/.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { site } from "../site.config";
import { DISTRICTS } from "../lib/districts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOSTING = path.join(ROOT, "hosting");
const DIST = path.join(ROOT, "dist");

async function main(): Promise<void> {
  console.log("Сборка PHP-версии сайта");

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  await exportMessages();
  await exportSiteConfig();
  await exportSeed();
  buildCss();

  // Код и шаблоны
  await cp(HOSTING, DIST, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(HOSTING, src);
      // Локальные данные и локальный конфиг на боевой сервер не уезжают.
      return !rel.startsWith("app\\data") && !rel.startsWith("app/data")
        && rel !== "app/config.php" && rel !== "app\\config.php"
        && !rel.endsWith(".src.css");
    },
  });
  await mkdir(path.join(DIST, "app", "data"), { recursive: true });
  await writeFile(path.join(DIST, "app", "data", ".htaccess"), "Require all denied\nDeny from all\n", "utf8");

  // Фотографии и картинки предпросмотра из public/
  await cp(path.join(ROOT, "public", "agent"), path.join(DIST, "agent"), { recursive: true });
  await cp(path.join(ROOT, "public", "og-default.jpg"), path.join(DIST, "og-default.jpg"));
  if (existsSync(path.join(ROOT, "public", "uploads"))) {
    await cp(path.join(ROOT, "public", "uploads"), path.join(DIST, "uploads"), { recursive: true });
  }
  await mkdir(path.join(DIST, "uploads"), { recursive: true });

  console.log(`Готово: ${path.relative(ROOT, DIST)}`);
}

/** Словарь интерфейса — один в один из messages/ru.json. */
async function exportMessages(): Promise<void> {
  const raw = await readFile(path.join(ROOT, "messages", "ru.json"), "utf8");
  const messages = JSON.parse(raw) as Record<string, unknown>;
  await mkdir(path.join(HOSTING, "app"), { recursive: true });
  await writeFile(path.join(HOSTING, "app", "messages.json"), JSON.stringify(messages, null, 1), "utf8");
  console.log("  словарь → app/messages.json");
}

/** Данные заказчика из site.config.ts. */
async function exportSiteConfig(): Promise<void> {
  const data = {
    agent: site.agent,
    legal: site.legal,
    site: site.site,
    districts: DISTRICTS,
  };
  await writeFile(path.join(HOSTING, "app", "site.json"), JSON.stringify(data, null, 1), "utf8");
  console.log("  данные заказчика → app/site.json");
}

/**
 * Начальные данные: только реальный кейс заказчика. Демо-объекты на боевой сайт не уезжают —
 * объекты заводятся в панели. Данные попадают в базу один раз, пока она пустая,
 * поэтому повторная выкладка ничего не затирает.
 */
async function exportSeed(): Promise<void> {
  const seed = {
    properties: [],
    cases: [
      {
        slug: "terrakota",
        title: "Коммерческое помещение в ЖК «Терракота»",
        kind: "RETAIL",
        dealType: "SALE",
        amountLabel: "500 млн ₸",
        durationLabel: "1,5 месяца",
        task: "Продать коммерческое помещение в жилом комплексе.",
        solution:
          "Нашла объект и за пару дней договорилась с собственником напрямую. На четвёртый день покупатель внёс задаток. Дальше сопровождала сделку, пока он оформлял кредит.",
        result: "Сделка на 500 млн ₸ закрыта за полтора месяца.",
        isFeatured: true,
        order: 0,
      },
    ],
    testimonials: [],
  };
  await writeFile(path.join(HOSTING, "app", "seed.json"), JSON.stringify(seed, null, 1), "utf8");
  console.log("  начальные данные → app/seed.json");
}

/** Стили собираются из того же globals.css, что и в Next-версии. */
function buildCss(): void {
  const input = path.join(HOSTING, "assets", "site.src.css");
  const output = path.join(HOSTING, "assets", "site.css");
  // shell: true — на Windows npx доступен только через оболочку.
  const result = spawnSync("npx", ["@tailwindcss/cli", "-i", input, "-o", output, "--minify"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error("Не удалось собрать CSS");
  }
  console.log("  стили → assets/site.css");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
