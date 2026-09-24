import "server-only";
import type { DealType, PropKind } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { cachedQuery, TAGS } from "@/lib/cache";

export interface CaseDto {
  id: string;
  slug: string;
  title: string;
  kind: PropKind;
  dealType: DealType;
  district: string | null;
  areaM2: number | null;
  amountLabel: string | null;
  durationLabel: string | null;
  task: string;
  solution: string;
  result: string;
  coverUrl: string | null;
  isFeatured: boolean;
  order: number;
  createdAt: string;
}

type CaseRow = {
  id: string;
  slug: string;
  title: string;
  kind: PropKind;
  dealType: DealType;
  district: string | null;
  areaM2: number | null;
  amountLabel: string | null;
  durationLabel: string | null;
  task: string;
  solution: string;
  result: string;
  coverUrl: string | null;
  isFeatured: boolean;
  order: number;
  createdAt: Date;
};

function toDto(row: CaseRow): CaseDto {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

const ORDER = [{ order: "asc" }, { createdAt: "desc" }] as const;

export const getFeaturedCases = cachedQuery(
  async (take: number): Promise<CaseDto[]> => {
    const rows = await prisma.case.findMany({ where: { isFeatured: true }, orderBy: [...ORDER], take });
    return rows.map(toDto);
  },
  ["cases-featured"],
  [TAGS.cases],
  [],
);

export const getAllCases = cachedQuery(
  async (): Promise<CaseDto[]> => (await prisma.case.findMany({ orderBy: [...ORDER] })).map(toDto),
  ["cases-all"],
  [TAGS.cases],
  [],
);

export const getCaseBySlug = cachedQuery(
  async (slug: string): Promise<CaseDto | null> => {
    const row = await prisma.case.findUnique({ where: { slug } });
    return row ? toDto(row) : null;
  },
  ["case-by-slug"],
  [TAGS.cases],
  null,
);

/** Кейсы по сдаче в аренду — для страницы собственников. */
export const getRentCases = cachedQuery(
  async (take: number): Promise<CaseDto[]> => {
    const rows = await prisma.case.findMany({ where: { dealType: { in: ["RENT", "BOTH"] } }, orderBy: [...ORDER], take });
    return rows.map(toDto);
  },
  ["cases-rent"],
  [TAGS.cases],
  [],
);
