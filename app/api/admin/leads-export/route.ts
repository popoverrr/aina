import { getTranslations } from "next-intl/server";
import { getAdminSession } from "@/auth";
import { routing } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { parseLeadFilters, queryLeads } from "@/lib/leads";

function csvCell(value: string | null | undefined): string {
  const v = (value ?? "").replace(/\r?\n/g, " ");
  return /[";,\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Экспорт заявок в CSV (UTF-8 с BOM, разделитель «;» — открывается в Excel без настройки). */
export async function GET(request: Request): Promise<Response> {
  const session = await getAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const filters = parseLeadFilters(Object.fromEntries(url.searchParams.entries()));
  const [leads, te, ta] = await Promise.all([
    queryLeads(filters, 5000),
    getTranslations({ locale: routing.defaultLocale, namespace: "enums" }),
    getTranslations({ locale: routing.defaultLocale, namespace: "admin.leads.columns" }),
  ]);

  const header = [ta("date"), ta("type"), ta("name"), ta("phone"), ta("object"), ta("comment"), "UTM source", "UTM medium", "UTM campaign", "UTM content", ta("status"), "Страница", "Referrer"];
  const lines = leads.map((l) =>
    [
      formatDate(l.createdAt, true),
      te(`leadType.${l.type}`),
      l.name,
      l.phone,
      l.property?.title ?? "",
      [l.comment, l.briefKind ? te(`kind.${l.briefKind}`) : null, l.briefAreaFrom !== null ? `от ${l.briefAreaFrom} м²` : null, l.briefAreaTo !== null ? `до ${l.briefAreaTo} м²` : null, l.briefBudget, l.briefDistricts.join(", ") || null, l.briefBusiness]
        .filter(Boolean)
        .join(" · "),
      l.utmSource,
      l.utmMedium,
      l.utmCampaign,
      l.utmContent,
      te(`leadStatus.${l.status}`),
      l.pagePath,
      l.referrer,
    ]
      .map(csvCell)
      .join(";"),
  );

  const csv = `﻿${[header.map(csvCell).join(";"), ...lines].join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="leads-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
