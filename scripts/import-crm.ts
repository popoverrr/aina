/**
 * Импорт объектов из выгрузки CRM «РБД» (CSV).
 *
 *   npm run import -- ./data/export.csv            # применить
 *   npm run import -- ./data/export.csv --dry-run  # только показать, что изменится
 *
 * Правила:
 *   - идемпотентность по externalId: существующие обновляются, новые создаются;
 *   - объекты НИКОГДА не удаляются: отсутствующие в выгрузке переводятся в HIDDEN
 *     (только те, у кого есть externalId — созданные вручную в админке не трогаем) и печатаются списком;
 *   - маппинг колонок — в scripts/crm-mapping.ts, правится под фактическую выгрузку;
 *   - в конце отчёт: создано / обновлено / скрыто / ошибок.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { parse } from "csv-parse/sync";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../lib/generated/prisma/client";
import { slugify } from "../lib/slug";
import {
  ADVANTAGES_SEPARATOR,
  columns,
  CSV_DELIMITER,
  CSV_ENCODING,
  IMAGES_SEPARATOR,
  parseBool,
  parseDeal,
  parseDistrict,
  parseKind,
  parseList,
  parseNumber,
  parseStatus,
} from "./crm-mapping";

loadEnv({ path: [".env.local", ".env"], quiet: true });

type Row = Record<string, string>;

interface Report {
  created: string[];
  updated: string[];
  hidden: string[];
  errors: Array<{ row: number; externalId: string; message: string }>;
}

function cell(row: Row, column: string): string | undefined {
  if (!column) return undefined;
  const value = row[column];
  return value === undefined ? undefined : String(value).trim();
}

function readCsv(file: string): Row[] {
  const buffer = readFileSync(file);
  const text = CSV_ENCODING === "win1251" ? new TextDecoder("windows-1251").decode(buffer) : buffer.toString("utf8").replace(/^﻿/, "");
  return parse(text, { columns: true, delimiter: CSV_DELIMITER, skip_empty_lines: true, trim: true, bom: true, relax_column_count: true }) as Row[];
}

/** Строка CSV → данные для upsert. Бросает Error с понятным текстом, если строка некорректна. */
function mapRow(row: Row): { externalId: string; data: Prisma.PropertyUncheckedCreateInput; images: string[] } {
  const externalId = cell(row, columns.externalId);
  if (!externalId) throw new Error(`пустой ${columns.externalId}`);

  const title = cell(row, columns.title);
  if (!title) throw new Error(`пустое «${columns.title}»`);

  const kind = parseKind(cell(row, columns.kind));
  if (!kind) throw new Error(`неизвестный тип объекта «${cell(row, columns.kind) ?? ""}»`);

  const dealType = parseDeal(cell(row, columns.dealType));
  if (!dealType) throw new Error(`неизвестный тип сделки «${cell(row, columns.dealType) ?? ""}»`);

  const district = parseDistrict(cell(row, columns.district));
  if (!district) throw new Error(`неизвестный район «${cell(row, columns.district) ?? ""}»`);

  const areaM2 = parseNumber(cell(row, columns.areaM2));
  if (areaM2 === undefined || areaM2 <= 0) throw new Error(`некорректная площадь «${cell(row, columns.areaM2) ?? ""}»`);

  const data: Prisma.PropertyUncheckedCreateInput = {
    externalId,
    slug: `${slugify(title)}-${slugify(externalId)}`.replace(/^-+/, "").slice(0, 100),
    title,
    kind,
    dealType,
    status: parseStatus(cell(row, columns.status)) ?? "ACTIVE",
    district,
    address: cell(row, columns.address) || null,
    landmark: cell(row, columns.landmark) || null,
    lat: parseNumber(cell(row, columns.lat)) ?? null,
    lng: parseNumber(cell(row, columns.lng)) ?? null,
    areaM2,
    ceilingM: parseNumber(cell(row, columns.ceilingM)) ?? null,
    floor: cell(row, columns.floor) || null,
    entrance: cell(row, columns.entrance) || null,
    powerKw: parseNumber(cell(row, columns.powerKw)) ?? null,
    hasWetPoint: parseBool(cell(row, columns.hasWetPoint)) ?? false,
    priceSale: parseNumber(cell(row, columns.priceSale)) ?? null,
    priceRentM2: parseNumber(cell(row, columns.priceRentM2)) ?? null,
    priceRentTotal: parseNumber(cell(row, columns.priceRentTotal)) ?? null,
    utilitiesIncluded: parseBool(cell(row, columns.utilitiesIncluded)) ?? false,
    isExclusive: parseBool(cell(row, columns.isExclusive)) ?? false,
    isHot: parseBool(cell(row, columns.isHot)) ?? false,
    descriptionMd: cell(row, columns.descriptionMd) ?? "",
    advantages: parseList(cell(row, columns.advantages), ADVANTAGES_SEPARATOR) ?? [],
    presentationUrl: cell(row, columns.presentationUrl) || null,
    publishedAt: new Date(),
  };

  const images = (parseList(cell(row, columns.images), IMAGES_SEPARATOR) ?? []).filter((u) => /^https?:\/\//.test(u));
  return { externalId, data, images };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Использование: npm run import -- ./data/export.csv [--dry-run]");
    process.exit(1);
  }

  const rows = readCsv(path.resolve(file));
  console.log(`Прочитано строк: ${rows.length}${dryRun ? " (режим --dry-run: ничего не пишем)" : ""}`);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const report: Report = { created: [], updated: [], hidden: [], errors: [] };
  const seen = new Set<string>();

  try {
    const existing = await prisma.property.findMany({
      where: { externalId: { not: null } },
      select: { id: true, externalId: true, slug: true, status: true, title: true },
    });
    const byExternalId = new Map(existing.map((p) => [p.externalId as string, p]));

    for (const [index, row] of rows.entries()) {
      const line = index + 2; // + заголовок, нумерация с 1
      let mapped: ReturnType<typeof mapRow>;
      try {
        mapped = mapRow(row);
      } catch (error) {
        report.errors.push({ row: line, externalId: cell(row, columns.externalId) ?? "", message: error instanceof Error ? error.message : String(error) });
        continue;
      }

      const { externalId, data, images } = mapped;
      if (seen.has(externalId)) {
        report.errors.push({ row: line, externalId, message: "дубликат externalId в выгрузке — строка пропущена" });
        continue;
      }
      seen.add(externalId);

      const current = byExternalId.get(externalId);
      const label = `${externalId} · ${data.title}`;

      if (current) {
        // при обновлении slug не меняем — ссылки на объект должны жить
        const { slug: _slug, publishedAt: _publishedAt, ...update } = data;
        void _slug;
        void _publishedAt;
        if (!dryRun) {
          await prisma.property.update({ where: { id: current.id }, data: update });
          if (images.length) await syncImages(prisma, current.id, images, data.title);
        }
        report.updated.push(label);
      } else {
        if (!dryRun) {
          // slug должен быть уникален и среди созданных вручную объектов
          const slugTaken = await prisma.property.findUnique({ where: { slug: data.slug }, select: { id: true } });
          if (slugTaken) data.slug = `${data.slug}-${Date.now().toString(36)}`;
          const created = await prisma.property.create({ data, select: { id: true } });
          if (images.length) await syncImages(prisma, created.id, images, data.title);
        }
        report.created.push(label);
      }
    }

    // Отсутствующие в выгрузке → HIDDEN (никогда не удаляем)
    for (const p of existing) {
      if (p.externalId && !seen.has(p.externalId) && p.status !== "HIDDEN") {
        if (!dryRun) await prisma.property.update({ where: { id: p.id }, data: { status: "HIDDEN" } });
        report.hidden.push(`${p.externalId} · ${p.title}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  // ---- Отчёт ----
  console.log("");
  console.log(`Создано:   ${report.created.length}`);
  console.log(`Обновлено: ${report.updated.length}`);
  console.log(`Скрыто:    ${report.hidden.length}`);
  console.log(`Ошибок:    ${report.errors.length}`);
  if (report.hidden.length) {
    console.log("\nПереведены в HIDDEN (отсутствуют в выгрузке, не удалены):");
    for (const h of report.hidden) console.log(`  - ${h}`);
  }
  if (report.errors.length) {
    console.log("\nОшибки (строки пропущены):");
    for (const e of report.errors) console.log(`  - строка ${e.row} [${e.externalId}]: ${e.message}`);
  }
  if (dryRun) console.log("\n--dry-run: в базу ничего не записано.");
}

/** Фото из выгрузки — по URL. Уже привязанные к объекту URL повторно не добавляются. */
async function syncImages(prisma: PrismaClient, propertyId: string, urls: string[], title: string): Promise<void> {
  const existing = await prisma.propertyImage.findMany({ where: { propertyId }, select: { url: true, order: true } });
  const known = new Set(existing.map((i) => i.url));
  let order = existing.reduce((max, i) => Math.max(max, i.order), -1) + 1;
  for (const url of urls) {
    if (known.has(url)) continue;
    // размеры неизвестны до загрузки — ставим 4:3 по умолчанию, next/image использует fill
    await prisma.propertyImage.create({ data: { propertyId, url, alt: title, width: 1600, height: 1200, order: order++ } });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
