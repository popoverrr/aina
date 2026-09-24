import "server-only";
import { prisma } from "@/lib/db";
import type { LeadStatus, Prisma } from "@/lib/generated/prisma/client";
import { LEAD_STATUSES } from "@/lib/validation/admin";

/** Запросы заявок для админки и CSV-экспорта — одна логика фильтров. */
export interface LeadFilters {
  status?: LeadStatus;
  from?: string;
  to?: string;
}

export function parseLeadFilters(sp: Record<string, string | string[] | undefined>): LeadFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = first(sp.status);
  const from = first(sp.from);
  const to = first(sp.to);
  const isDate = (v: string | undefined): v is string => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));
  return {
    status: (LEAD_STATUSES as readonly string[]).includes(status ?? "") ? (status as LeadStatus) : undefined,
    from: isDate(from) ? from : undefined,
    to: isDate(to) ? to : undefined,
  };
}

export function leadWhere(f: LeadFilters): Prisma.LeadWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  if (f.from) createdAt.gte = new Date(`${f.from}T00:00:00+05:00`);
  if (f.to) createdAt.lte = new Date(`${f.to}T23:59:59+05:00`);
  return {
    ...(f.status ? { status: f.status } : {}),
    ...(f.from || f.to ? { createdAt } : {}),
  };
}

export const leadListSelect = {
  id: true,
  type: true,
  status: true,
  name: true,
  phone: true,
  comment: true,
  briefKind: true,
  briefAreaFrom: true,
  briefAreaTo: true,
  briefBudget: true,
  briefDistricts: true,
  briefBusiness: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  utmContent: true,
  pagePath: true,
  referrer: true,
  createdAt: true,
  property: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.LeadSelect;

export type LeadRow = Prisma.LeadGetPayload<{ select: typeof leadListSelect }>;

export async function queryLeads(f: LeadFilters, take = 500): Promise<LeadRow[]> {
  return prisma.lead.findMany({ where: leadWhere(f), orderBy: { createdAt: "desc" }, take, select: leadListSelect });
}
