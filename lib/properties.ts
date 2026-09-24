import "server-only";
import { Prisma, type DealType, type PropKind, type PropStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { cachedQuery, TAGS } from "@/lib/cache";
import { type CatalogFilters, PUBLIC_STATUSES_LIST } from "@/lib/catalog-filters";
import { districtNamesFromSlugs, districtSlugByName } from "@/lib/districts";
import { formatAreaRange } from "@/lib/format";

export { PAGE_SIZE, CATALOG_SORTS, filtersToSearchParams, hasActiveFilters, parseCatalogFilters } from "@/lib/catalog-filters";
export type { CatalogFilters, CatalogSort, SearchParamsInput } from "@/lib/catalog-filters";

/**
 * Публичный слой доступа к объектам.
 *
 * Правило закрытых объектов (isExclusive): точный адрес, координаты, полная цена, презентация
 * и фото интерьера (всё, кроме обложки) отдаются только после заявки (unlocked = true).
 * Отсечение происходит здесь, на сервере (publicPropertySelect + toPublicProperty), поэтому
 * данных нет в HTML-ответе вообще — компоненты получают уже очищенный DTO.
 */

export const PUBLIC_STATUSES: PropStatus[] = [...PUBLIC_STATUSES_LIST];

export interface PublicImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface PublicPropertyCard {
  id: string;
  slug: string;
  title: string;
  kind: PropKind;
  dealType: DealType;
  status: PropStatus;
  district: string;
  landmark: string | null;
  isExclusive: boolean;
  isHot: boolean;
  isFeatured: boolean;
  /** null для закрытых объектов — вместо него areaLabel с диапазоном */
  areaM2: number | null;
  areaLabel: string;
  priceSale: number | null;
  priceRentTotal: number | null;
  priceRentM2: number | null;
  advantages: string[];
  cover: PublicImage | null;
  updatedAt: string;
}

export interface PublicPropertyDetail extends PublicPropertyCard {
  address: string | null;
  lat: number | null;
  lng: number | null;
  ceilingM: number | null;
  floor: string | null;
  entrance: string | null;
  powerKw: number | null;
  hasWetPoint: boolean;
  utilitiesIncluded: boolean;
  descriptionMd: string;
  presentationUrl: string | null;
  images: PublicImage[];
  /** true — посетитель отправил заявку по этому объекту, детали открыты */
  unlocked: boolean;
  publishedAt: string | null;
}

/** Поля, которые вообще могут попасть в публичный ответ. Ничего сверх этого из БД не читается. */
export const publicPropertySelect = {
  id: true,
  slug: true,
  title: true,
  kind: true,
  dealType: true,
  status: true,
  district: true,
  address: true,
  landmark: true,
  lat: true,
  lng: true,
  areaM2: true,
  ceilingM: true,
  floor: true,
  entrance: true,
  powerKw: true,
  hasWetPoint: true,
  priceSale: true,
  priceRentM2: true,
  priceRentTotal: true,
  utilitiesIncluded: true,
  isExclusive: true,
  isHot: true,
  isFeatured: true,
  descriptionMd: true,
  advantages: true,
  presentationUrl: true,
  publishedAt: true,
  updatedAt: true,
  images: {
    orderBy: { order: "asc" },
    select: { url: true, alt: true, width: true, height: true },
  },
} satisfies Prisma.PropertySelect;

type PropertyRow = Prisma.PropertyGetPayload<{ select: typeof publicPropertySelect }>;

/** Полный DTO без Decimal/Date — живёт только на сервере (кеш), наружу уходит через toPublicProperty. */
interface FullPropertyDto extends Omit<PublicPropertyDetail, "unlocked" | "areaM2" | "areaLabel" | "cover"> {
  areaM2: number;
}

function dec(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}

function toFullDto(row: PropertyRow): FullPropertyDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    dealType: row.dealType,
    status: row.status,
    district: row.district,
    address: row.address,
    landmark: row.landmark,
    lat: row.lat,
    lng: row.lng,
    areaM2: row.areaM2,
    ceilingM: row.ceilingM,
    floor: row.floor,
    entrance: row.entrance,
    powerKw: row.powerKw,
    hasWetPoint: row.hasWetPoint,
    priceSale: dec(row.priceSale),
    priceRentM2: dec(row.priceRentM2),
    priceRentTotal: dec(row.priceRentTotal),
    utilitiesIncluded: row.utilitiesIncluded,
    isExclusive: row.isExclusive,
    isHot: row.isHot,
    isFeatured: row.isFeatured,
    descriptionMd: row.descriptionMd,
    advantages: row.advantages,
    presentationUrl: row.presentationUrl,
    images: row.images,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Очистка под публичный показ. Для закрытого объекта без unlocked — только разрешённое. */
export function toPublicProperty(full: FullPropertyDto, unlocked: boolean): PublicPropertyDetail {
  const restricted = full.isExclusive && !unlocked;
  const cover = full.images[0] ?? null;
  return {
    id: full.id,
    slug: full.slug,
    title: full.title,
    kind: full.kind,
    dealType: full.dealType,
    status: full.status,
    district: full.district,
    landmark: full.landmark,
    isExclusive: full.isExclusive,
    isHot: full.isHot,
    isFeatured: full.isFeatured,
    areaM2: restricted ? null : full.areaM2,
    areaLabel: restricted ? formatAreaRange(full.areaM2) : "",
    priceSale: restricted ? null : full.priceSale,
    priceRentTotal: restricted ? null : full.priceRentTotal,
    priceRentM2: restricted ? null : full.priceRentM2,
    advantages: full.advantages,
    cover,
    updatedAt: full.updatedAt,
    address: restricted ? null : full.address,
    lat: restricted ? null : full.lat,
    lng: restricted ? null : full.lng,
    ceilingM: full.ceilingM,
    floor: full.floor,
    entrance: full.entrance,
    powerKw: full.powerKw,
    hasWetPoint: full.hasWetPoint,
    utilitiesIncluded: full.utilitiesIncluded,
    descriptionMd: full.descriptionMd,
    presentationUrl: restricted ? null : full.presentationUrl,
    images: restricted ? (cover ? [cover] : []) : full.images,
    unlocked: full.isExclusive ? unlocked : true,
    publishedAt: full.publishedAt,
  };
}

function toCard(full: FullPropertyDto): PublicPropertyCard {
  const detail = toPublicProperty(full, false);
  return {
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    kind: detail.kind,
    dealType: detail.dealType,
    status: detail.status,
    district: detail.district,
    landmark: detail.landmark,
    isExclusive: detail.isExclusive,
    isHot: detail.isHot,
    isFeatured: detail.isFeatured,
    areaM2: detail.areaM2,
    areaLabel: detail.areaLabel,
    priceSale: detail.priceSale,
    priceRentTotal: detail.priceRentTotal,
    priceRentM2: detail.priceRentM2,
    advantages: detail.advantages.slice(0, 2),
    cover: detail.cover,
    updatedAt: detail.updatedAt,
  };
}

// ---------- Каталог: запросы ----------

function buildWhere(f: CatalogFilters): Prisma.PropertyWhereInput {
  const and: Prisma.PropertyWhereInput[] = [{ status: { in: PUBLIC_STATUSES } }];

  if (f.deal) and.push({ dealType: { in: [f.deal, "BOTH"] } });
  if (f.kind) and.push({ kind: f.kind });
  if (f.districts.length) and.push({ district: { in: districtNamesFromSlugs(f.districts) } });
  if (f.areaFrom !== undefined) and.push({ areaM2: { gte: f.areaFrom } });
  if (f.areaTo !== undefined) and.push({ areaM2: { lte: f.areaTo } });

  if (f.priceFrom !== undefined || f.priceTo !== undefined) {
    const range: Prisma.DecimalNullableFilter = {};
    if (f.priceFrom !== undefined) range.gte = f.priceFrom;
    if (f.priceTo !== undefined) range.lte = f.priceTo;
    if (f.deal === "RENT") and.push({ priceRentTotal: range });
    else if (f.deal === "SALE") and.push({ priceSale: range });
    else and.push({ OR: [{ priceRentTotal: range }, { priceSale: range }] });
  }

  if (f.hot) and.push({ isHot: true });
  // «Первая линия» — по флагу entrance: объекты с заполненным описанием входа (отдельный вход с улицы).
  if (f.firstLine) and.push({ entrance: { not: null } }, { entrance: { not: "" } });

  return { AND: and };
}

function buildOrderBy(f: CatalogFilters): Prisma.PropertyOrderByWithRelationInput[] {
  const priceField = f.deal === "SALE" ? "priceSale" : "priceRentTotal";
  switch (f.sort) {
    case "price_asc":
      return [{ [priceField]: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }];
    case "price_desc":
      return [{ [priceField]: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }];
    case "area_desc":
      return [{ areaM2: "desc" }, { updatedAt: "desc" }];
    case "date":
      return [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    case "hot":
    default:
      return [{ isHot: "desc" }, { updatedAt: "desc" }];
  }
}

export interface CatalogResult {
  items: PublicPropertyCard[];
  total: number;
}

export const searchProperties = cachedQuery(
  async (filters: CatalogFilters): Promise<CatalogResult> => {
    const where = buildWhere(filters);
    const [rows, total] = await Promise.all([
      prisma.property.findMany({ where, orderBy: buildOrderBy(filters), take: filters.limit, select: publicPropertySelect }),
      prisma.property.count({ where }),
    ]);
    return { items: rows.map((r) => toCard(toFullDto(r))), total };
  },
  ["properties-search"],
  [TAGS.properties],
  { items: [], total: 0 },
);

export const getHotProperties = cachedQuery(
  async (take: number): Promise<PublicPropertyCard[]> => {
    const rows = await prisma.property.findMany({
      where: { isHot: true, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take,
      select: publicPropertySelect,
    });
    return rows.map((r) => toCard(toFullDto(r)));
  },
  ["properties-hot"],
  [TAGS.properties],
  [],
);

export const getSimilarProperties = cachedQuery(
  async (kind: PropKind, excludeId: string | null, take: number): Promise<PublicPropertyCard[]> => {
    const rows = await prisma.property.findMany({
      where: { kind, status: "ACTIVE", ...(excludeId ? { id: { not: excludeId } } : {}) },
      orderBy: [{ isHot: "desc" }, { updatedAt: "desc" }],
      take,
      select: publicPropertySelect,
    });
    return rows.map((r) => toCard(toFullDto(r)));
  },
  ["properties-similar"],
  [TAGS.properties],
  [],
);

/** Полный DTO по slug — только для серверного кода; наружу отдавать через toPublicProperty(). */
export const getFullPropertyBySlug = cachedQuery(
  async (slug: string): Promise<FullPropertyDto | null> => {
    const row = await prisma.property.findFirst({
      where: { slug, status: { in: PUBLIC_STATUSES } },
      select: publicPropertySelect,
    });
    return row ? toFullDto(row) : null;
  },
  ["property-by-slug"],
  [TAGS.properties],
  null,
);

export const countObjectsInWork = cachedQuery(
  async (): Promise<number> => prisma.property.count({ where: { status: { in: PUBLIC_STATUSES } } }),
  ["properties-count"],
  [TAGS.properties],
  0,
);

export const getPublicPropertySlugs = cachedQuery(
  async (): Promise<Array<{ slug: string; updatedAt: string }>> => {
    const rows = await prisma.property.findMany({
      where: { status: { in: PUBLIC_STATUSES } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() }));
  },
  ["properties-slugs"],
  [TAGS.properties],
  [],
);

/** Подпись для уведомлений: «Стрит-ритейл 120 м², Медеуский». */
export async function getPropertyLabelById(id: string): Promise<{ id: string; kind: PropKind; areaM2: number; district: string; slug: string } | null> {
  const row = await prisma.property.findUnique({ where: { id }, select: { id: true, kind: true, areaM2: true, district: true, slug: true } });
  return row;
}

export function districtSlugOf(property: Pick<PublicPropertyCard, "district">): string | undefined {
  return districtSlugByName(property.district);
}
