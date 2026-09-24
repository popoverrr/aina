/**
 * МАППИНГ КОЛОНОК ВЫГРУЗКИ CRM «РБД» → поля модели Property.
 *
 * ВАЖНО: реальный формат выгрузки из «РБД» на момент разработки НЕИЗВЕСТЕН.
 * Ниже — гипотетические названия колонок. Когда появится настоящий CSV:
 *   1. Откройте его и посмотрите первую строку (заголовки).
 *   2. Поправьте значения `column` в объекте `columns` ниже под фактические заголовки.
 *   3. При необходимости поправьте словари `kindMap`, `dealMap`, `statusMap` и функции-парсеры.
 *   4. Прогоните `npm run import -- ./data/export.csv --dry-run` и проверьте отчёт.
 *
 * Больше ничего в проекте под выгрузку править не нужно — вся логика привязки в этом файле.
 */
import { DISTRICTS } from "../lib/districts";
import type { DealType, PropKind, PropStatus } from "../lib/generated/prisma/client";

/** Разделитель CSV: «РБД» может выгружать с «;» (Excel-стиль). Поменяйте при необходимости. */
export const CSV_DELIMITER = ";";

/** Кодировка файла. Если выгрузка в Windows-1251 — поменяйте на "win1251" (скрипт перекодирует). */
export const CSV_ENCODING: "utf8" | "win1251" = "utf8";

/**
 * Соответствие «поле Property → заголовок колонки в CSV».
 * Пустая строка означает «колонки нет в выгрузке» — поле будет пропущено (при обновлении не затирается).
 */
export const columns = {
  /** Ключ идемпотентности. ОБЯЗАТЕЛЕН: по нему объекты обновляются, а не дублируются. */
  externalId: "ID",
  title: "Название",
  kind: "Тип объекта",
  dealType: "Тип сделки",
  status: "Статус",
  district: "Район",
  address: "Адрес",
  landmark: "Ориентир",
  lat: "Широта",
  lng: "Долгота",
  areaM2: "Площадь",
  ceilingM: "Высота потолков",
  floor: "Этаж",
  entrance: "Вход",
  powerKw: "Мощность",
  hasWetPoint: "Мокрая точка",
  priceSale: "Цена продажи",
  priceRentM2: "Аренда за м2",
  priceRentTotal: "Аренда в месяц",
  utilitiesIncluded: "Коммуналка включена",
  isExclusive: "Эксклюзив",
  isHot: "Горящий",
  descriptionMd: "Описание",
  /** Преимущества — одной ячейкой, разделитель задаётся в ADVANTAGES_SEPARATOR */
  advantages: "Преимущества",
  presentationUrl: "Презентация",
  /** Ссылки на фото — одной ячейкой через разделитель IMAGES_SEPARATOR */
  images: "Фото",
} as const;

export const ADVANTAGES_SEPARATOR = "|";
export const IMAGES_SEPARATOR = "|";

/** Значения колонки «Тип объекта» в выгрузке → PropKind. Ключи — в нижнем регистре. */
export const kindMap: Record<string, PropKind> = {
  "стрит-ритейл": "RETAIL",
  "стрит ритейл": "RETAIL",
  торговое: "RETAIL",
  "торговое помещение": "RETAIL",
  магазин: "RETAIL",
  офис: "OFFICE",
  "офисное помещение": "OFFICE",
  склад: "WAREHOUSE",
  "складское помещение": "WAREHOUSE",
  участок: "LAND",
  "земельный участок": "LAND",
  земля: "LAND",
  здание: "BUILDING",
  осз: "BUILDING",
};

/** Значения колонки «Тип сделки» → DealType. */
export const dealMap: Record<string, DealType> = {
  аренда: "RENT",
  сдам: "RENT",
  продажа: "SALE",
  продам: "SALE",
  "аренда/продажа": "BOTH",
  "аренда или продажа": "BOTH",
  оба: "BOTH",
};

/** Значения колонки «Статус» → PropStatus. Отсутствующая колонка = ACTIVE. */
export const statusMap: Record<string, PropStatus> = {
  активен: "ACTIVE",
  активный: "ACTIVE",
  "в работе": "ACTIVE",
  бронь: "RESERVED",
  забронирован: "RESERVED",
  закрыт: "CLOSED",
  продан: "CLOSED",
  сдан: "CLOSED",
  скрыт: "HIDDEN",
  архив: "HIDDEN",
};

/** «Да/нет» в разных написаниях → boolean. */
export function parseBool(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (["да", "yes", "true", "1", "+", "есть"].includes(v)) return true;
  if (["нет", "no", "false", "0", "-", "нет данных"].includes(v)) return false;
  return undefined;
}

/** Числа с пробелами, запятой и единицами измерения: «1 250,5 м²» → 1250.5 */
export function parseNumber(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/** Район: принимаем «Медеуский», «Медеуский район», «медеу» → каноническое имя из справочника. */
export function parseDistrict(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase().replace(/\s*район\s*$/, "");
  const found = DISTRICTS.find((d) => d.name.toLowerCase() === v || d.slug === v || d.name.toLowerCase().startsWith(v.slice(0, 5)));
  return found?.name;
}

export function parseKind(raw: string | undefined): PropKind | undefined {
  return raw ? kindMap[raw.trim().toLowerCase()] : undefined;
}

export function parseDeal(raw: string | undefined): DealType | undefined {
  return raw ? dealMap[raw.trim().toLowerCase()] : undefined;
}

export function parseStatus(raw: string | undefined): PropStatus | undefined {
  return raw ? statusMap[raw.trim().toLowerCase()] : undefined;
}

export function parseList(raw: string | undefined, separator: string): string[] | undefined {
  if (raw === undefined) return undefined;
  return raw
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
}
