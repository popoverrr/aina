/**
 * Сборка статичного превью публичных страниц для GitHub Pages.
 *
 *   npm run preview:build
 *
 * Скрипт сам собирает проект с префиксом пути, поднимает сервер на отдельном порту,
 * обходит публичные страницы и складывает снимок в out-preview/.
 *
 * Зачем снимок, а не `output: "export"`: сайт использует Server Actions, БД и Auth.js,
 * которые статический экспорт не поддерживает. Поэтому мы поднимаем настоящий сервер
 * и сохраняем то, что он отдал, — вёрстка и содержимое совпадают с рабочим сайтом.
 * Нужна поднятая база (`npm run db:local`): страницы рендерятся из неё.
 *
 * Чего в превью нет и быть не может (статика без сервера):
 *   - отправка форм (Server Actions) — перехватывается и показывает пояснение;
 *   - фильтры каталога и «Показать ещё» (фильтрация на сервере по searchParams);
 *   - админка, вход и загрузка фото.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Git Bash на Windows подменяет значения вида `/aina` на путь Windows, поэтому переменную
 * можно задавать и без ведущего слэша: `PREVIEW_BASE_PATH=aina`.
 */
function normalizeBasePath(raw: string | undefined): string {
  const value = (raw ?? "aina").trim().replace(/\\/g, "/").replace(/\/+$/, "");
  const name = value.includes(":/") ? (value.split("/").pop() ?? "") : value.replace(/^\/+/, "");
  return name ? `/${name}` : "";
}

const BASE_PATH = normalizeBasePath(process.env.PREVIEW_BASE_PATH);
const SITE_URL = process.env.PREVIEW_SITE_URL ?? "https://popoverrr.github.io/aina";
const PORT = process.env.PREVIEW_PORT ?? "3100";
const OUT = process.env.PREVIEW_OUT ?? "out-preview";
const ORIGIN = `http://127.0.0.1:${PORT}`;
const NEXT_BIN = path.join("node_modules", "next", "dist", "bin", "next");

/** Пояснение вместо отправки формы + заметка над фильтрами каталога. */
const PREVIEW_SCRIPT = `<script>(function(){
var MSG='Это статичное превью: заявка не отправляется. На рабочем сайте форма пишет заявку в базу и присылает уведомление.';
function note(host,text){var b=host.querySelector('[data-preview-note]');
if(!b){b=document.createElement('p');b.setAttribute('data-preview-note','');b.setAttribute('role','status');
b.style.cssText='margin-top:12px;border:1px dashed #8A6A3B;background:rgba(138,106,59,.08);color:#12161C;border-radius:8px;padding:10px 12px;font-size:14px;line-height:1.5';
host.appendChild(b);}b.textContent=text;return b;}
document.addEventListener('submit',function(e){var f=e.target;
if(!f||f.nodeName!=='FORM'||f.id==='catalog-filters')return;
e.preventDefault();e.stopPropagation();note(f,MSG).scrollIntoView({block:'nearest'});},true);
function filters(){var f=document.getElementById('catalog-filters');
if(f&&!f.querySelector('[data-preview-note]'))note(f,'В статичном превью фильтры не применяются — выборка считается на сервере.');}
filters();setInterval(filters,1000);
})();</script>`;

const NOINDEX = '<meta name="robots" content="noindex,nofollow"/>';

const previewEnv: NodeJS.ProcessEnv = {
  ...process.env,
  PREVIEW_BASE_PATH: BASE_PATH,
  NEXT_PUBLIC_SITE_URL: SITE_URL,
};

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [NEXT_BIN, ...args], { env: previewEnv, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`next ${args.join(" ")} → код ${String(code)}`))));
  });
}

async function startServer(): Promise<ChildProcess> {
  const child = spawn(process.execPath, [NEXT_BIN, "start", "-p", PORT], {
    env: previewEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout?.on("data", (chunk: Buffer) => (log += chunk.toString()));
  child.stderr?.on("data", (chunk: Buffer) => (log += chunk.toString()));
  child.on("error", (error: unknown) => (log += String(error)));

  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      // Сервер считается поднятым, когда отвечает что угодно кроме ошибки: адрес без
      // завершающего слэша, чтобы не ловить нормализующий редирект.
      const res = await fetch(`${ORIGIN}${BASE_PATH}`, { redirect: "follow" });
      if (res.status < 500) return child;
    } catch {
      // сервер ещё поднимается
    }
  }
  child.kill();
  throw new Error(`Сервер превью не ответил на ${ORIGIN}${BASE_PATH}\n${log.trim()}`);
}

/** Убирает префикс basePath: на GitHub Pages корень сайта = корень ветки. */
function stripBase(pathname: string): string {
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) return pathname.slice(BASE_PATH.length) || "/";
  return pathname;
}

function outFile(appPath: string): string {
  const clean = appPath.replace(/^\/+|\/+$/g, "");
  return path.join(OUT, clean ? `${clean}/index.html` : "index.html");
}

async function fetchText(url: string): Promise<{ status: number; body: string }> {
  const res = await fetch(url, { redirect: "follow" });
  return { status: res.status, body: await res.text() };
}

/** Страницы берём из sitemap сайта, плюс те, которых там нет по смыслу. */
async function collectPaths(): Promise<string[]> {
  const { status, body } = await fetchText(`${ORIGIN}${BASE_PATH}/sitemap.xml`);
  if (status !== 200) throw new Error(`sitemap.xml вернул ${status}`);
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => stripBase(new URL(m[1] ?? "").pathname));
  return [...new Set([...locs, "/privacy", "/thanks"])].sort();
}

/**
 * Ссылки страниц Next префиксует сам, а вот `src` у next/image с `unoptimized: true`
 * остаётся без basePath — дописываем его и в разметке, и в RSC-пейлоаде, иначе после
 * гидрации картинки снова уедут на несуществующий путь. Заодно префикс попадает
 * в абсолютные адреса OpenGraph и JSON-LD.
 */
const ASSET_PATTERNS = ["/agent/", "/uploads/", "/og-default\\.jpg"];

function withBasePathAssets(html: string): string {
  if (!BASE_PATH) return html;
  const escapedBase = BASE_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return ASSET_PATTERNS.reduce(
    (acc, pattern) => acc.replace(new RegExp(`(?<!${escapedBase})${pattern}`, "g"), (match) => `${BASE_PATH}${match}`),
    html,
  );
}

function postprocess(html: string): string {
  const withAssets = withBasePathAssets(html);
  const withMeta = withAssets.includes("<head>") ? withAssets.replace("<head>", `<head>${NOINDEX}`) : withAssets;
  return withMeta.includes("</body>") ? withMeta.replace("</body>", `${PREVIEW_SCRIPT}</body>`) : withMeta + PREVIEW_SCRIPT;
}

async function savePage(appPath: string, html: string): Promise<void> {
  const file = outFile(appPath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, postprocess(html), "utf8");
}

async function snapshot(): Promise<void> {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // Статика и public/ копируются целиком: так в снимок попадают и лениво подгружаемые чанки,
  // которых нет в HTML.
  await cp(".next/static", path.join(OUT, "_next/static"), { recursive: true });
  await cp("public", OUT, { recursive: true });
  await rm(path.join(OUT, "uploads"), { recursive: true, force: true });

  const paths = await collectPaths();
  const failed: string[] = [];

  for (const appPath of paths) {
    const { status, body } = await fetchText(`${ORIGIN}${BASE_PATH}${appPath}`);
    if (status !== 200) {
      failed.push(`${appPath} → ${status}`);
      continue;
    }
    await savePage(appPath, body);
    console.log(`  ${status}  ${appPath}`);
  }

  // GitHub Pages отдаёт 404.html для неизвестных адресов.
  const notFound = await fetchText(`${ORIGIN}${BASE_PATH}/__preview-not-found`);
  await writeFile(path.join(OUT, "404.html"), postprocess(notFound.body), "utf8");

  // .nojekyll обязателен: иначе Pages выбросит папку _next (начинается с подчёркивания).
  await writeFile(path.join(OUT, ".nojekyll"), "", "utf8");
  await writeFile(path.join(OUT, "robots.txt"), "User-agent: *\nDisallow: /\n", "utf8");
  await rm(path.join(OUT, "sitemap.xml"), { force: true });

  console.log(`\nСтраниц сохранено: ${paths.length - failed.length} из ${paths.length}`);
  if (failed.length) throw new Error(`Не сохранены: ${failed.join(", ")}`);

  const home = await readFile(path.join(OUT, "index.html"), "utf8");
  console.log(`Главная: ${Math.round(home.length / 1024)} KB, noindex — ${home.includes("noindex") ? "есть" : "НЕТ"}`);
}

async function main(): Promise<void> {
  console.log(`Сборка превью: basePath=${BASE_PATH}, адрес=${SITE_URL}`);
  // PREVIEW_SKIP_BUILD=1 — переснять страницы по уже собранному .next (быстрая итерация).
  if (process.env.PREVIEW_SKIP_BUILD !== "1") await run(["build"]);
  const server = await startServer();
  try {
    await snapshot();
  } finally {
    server.kill();
  }
  console.log(`Готово: ${OUT}/`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
