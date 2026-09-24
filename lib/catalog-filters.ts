import type { PropKind } from "@/lib/generated/prisma/enums";
import { districtNamesFromSlugs } from "@/lib/districts";
import { PROP_KINDS } from "@/lib/enums";

/**
 * Фильтры каталога: разбор из searchParams и сериализация обратно в URL.
 * Модуль без серверных зависимостей — используется и в клиентском компоненте фильтров, и на сервере.
 */

export const PAGE_SIZE = 12;

/** Статусы, видимые публично (значения PropStatus). */
export const PUBLIC_STATUSES_LIST = ["ACTIVE", "RESERVED"] as const;

export type CatalogSort = "hot" | "price_asc" | "price_desc" | "area_desc" | "date";
export const CATALOG_SORTS: CatalogSort[] = ["hot", "price_asc", "price_desc", "area_desc", "date"];

export interface CatalogFilters {
  deal?: "RENT" | "SALE";
  kind?: PropKind;
  /** slug'и районов из справочника */
  districts: string[];
  areaFrom?: number;
  areaTo?: number;
  priceFrom?: number;
  priceTo?: number;
  hot: boolean;
  firstLine: boolean;
  sort: CatalogSort;
  /** сколько показать: PAGE_SIZE × страница («Показать ещё») */
  limit: number;
}

export type SearchParamsInput = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = first(v);
  if (!s) return undefined;
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseCatalogFilters(sp: SearchParamsInput): CatalogFilters {
  const deal = first(sp.deal);
  const kind = first(sp.kind);
  const districtsRaw = sp.district;
  const districts = (Array.isArray(districtsRaw) ? districtsRaw : (districtsRaw ?? "").split(","))
    .map((d) => d.trim())
    .filter(Boolean);
  const sort = first(sp.sort);
  const limitRaw = num(sp.limit);

  return {
    deal: deal === "RENT" || deal === "SALE" ? deal : undefined,
    kind: (PROP_KINDS as readonly string[]).includes(kind ?? "") ? (kind as PropKind) : undefined,
    districts: districts.filter((d) => districtNamesFromSlugs([d]).length > 0),
    areaFrom: num(sp.areaFrom),
    areaTo: num(sp.areaTo),
    priceFrom: num(sp.priceFrom),
    priceTo: num(sp.priceTo),
    hot: first(sp.hot) === "1",
    firstLine: first(sp.firstLine) === "1",
    sort: (CATALOG_SORTS as string[]).includes(sort ?? "") ? (sort as CatalogSort) : "hot",
    limit: Math.min(Math.max(PAGE_SIZE, Math.floor((limitRaw ?? PAGE_SIZE) / PAGE_SIZE) * PAGE_SIZE), PAGE_SIZE * 20),
  };
}

export function filtersToSearchParams(f: CatalogFilters, overrides: Partial<CatalogFilters> = {}): URLSearchParams {
  const m = { ...f, ...overrides };
  const p = new URLSearchParams();
  if (m.deal) p.set("deal", m.deal);
  if (m.kind) p.set("kind", m.kind);
  if (m.districts.length) p.set("district", m.districts.join(","));
  if (m.areaFrom !== undefined) p.set("areaFrom", String(m.areaFrom));
  if (m.areaTo !== undefined) p.set("areaTo", String(m.areaTo));
  if (m.priceFrom !== undefined) p.set("priceFrom", String(m.priceFrom));
  if (m.priceTo !== undefined) p.set("priceTo", String(m.priceTo));
  if (m.hot) p.set("hot", "1");
  if (m.firstLine) p.set("firstLine", "1");
  if (m.sort !== "hot") p.set("sort", m.sort);
  if (m.limit > PAGE_SIZE) p.set("limit", String(m.limit));
  return p;
}

/** Есть ли параметры, отличные от дефолта — такие комбинации получают noindex. */
export function hasActiveFilters(f: CatalogFilters): boolean {
  return filtersToSearchParams(f).toString().length > 0;
}
