import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LeadStatusSelect } from "@/components/admin/LeadStatusSelect";
import { AdminPageHeader, AdminTable, Td, Th } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/Button";
import { requireAdminPage } from "@/lib/actions/admin";
import { cn } from "@/lib/cn";
import { formatDate, formatPhoneDisplay } from "@/lib/format";
import { parseLeadFilters, queryLeads } from "@/lib/leads";
import { LEAD_STATUSES } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminLeadsPage({ searchParams }: Props) {
  await requireAdminPage("/admin/leads");
  const [t, te, sp] = await Promise.all([getTranslations("admin"), getTranslations("enums"), searchParams]);
  const filters = parseLeadFilters(sp);
  const leads = await queryLeads(filters);
  const newCount = leads.filter((l) => l.status === "NEW").length;

  const exportQs = new URLSearchParams();
  if (filters.status) exportQs.set("status", filters.status);
  if (filters.from) exportQs.set("from", filters.from);
  if (filters.to) exportQs.set("to", filters.to);

  const inputClass = "h-10 rounded-base border border-line bg-surface px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none";

  return (
    <>
      <AdminPageHeader
        title={t("leads.title")}
        actions={
          <a href={`/api/admin/leads-export?${exportQs.toString()}`} className={buttonClasses("secondary", "md")}>
            <Download className="size-4" aria-hidden="true" />
            {t("leads.export")}
          </a>
        }
      >
        {newCount ? <p className="text-sm text-hot">{t("leads.newCount", { count: newCount })}</p> : null}
      </AdminPageHeader>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          {t("leads.filter.status")}
          <select name="status" defaultValue={filters.status ?? ""} className={inputClass}>
            <option value="">{t("common.all")}</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {te(`leadStatus.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          {t("leads.filter.from")}
          <input type="date" name="from" defaultValue={filters.from ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          {t("leads.filter.to")}
          <input type="date" name="to" defaultValue={filters.to ?? ""} className={inputClass} />
        </label>
        <button type="submit" className={buttonClasses("secondary", "sm")}>
          {t("leads.filter.apply")}
        </button>
        <Link href="/admin/leads" className={buttonClasses("ghost", "sm")}>
          {t("leads.filter.reset")}
        </Link>
      </form>

      <AdminTable
        head={
          <>
            <Th>{t("leads.columns.date")}</Th>
            <Th>{t("leads.columns.type")}</Th>
            <Th>{t("leads.columns.name")}</Th>
            <Th>{t("leads.columns.phone")}</Th>
            <Th>{t("leads.columns.object")}</Th>
            <Th>{t("leads.columns.comment")}</Th>
            <Th>{t("leads.columns.source")}</Th>
            <Th>{t("leads.columns.status")}</Th>
          </>
        }
      >
        {leads.length === 0 ? (
          <tr>
            <Td className="text-ink-muted">{t("common.empty")}</Td>
          </tr>
        ) : (
          leads.map((l) => {
            const brief = [
              l.briefKind ? te(`kind.${l.briefKind}`) : null,
              l.briefAreaFrom !== null || l.briefAreaTo !== null ? `${l.briefAreaFrom !== null ? `от ${l.briefAreaFrom}` : ""} ${l.briefAreaTo !== null ? `до ${l.briefAreaTo}` : ""} м²`.trim() : null,
              l.briefBudget,
              l.briefDistricts.length ? l.briefDistricts.join(", ") : null,
              l.briefBusiness,
            ].filter(Boolean);
            const source = [l.utmSource, l.utmMedium, l.utmCampaign].filter(Boolean).join(" / ");
            return (
              <tr key={l.id} className={cn(l.status === "NEW" && "bg-accent/5 font-medium")}>
                <Td className="whitespace-nowrap text-ink-muted tabular">{formatDate(l.createdAt, true)}</Td>
                <Td>{te(`leadType.${l.type}`)}</Td>
                <Td>{l.name}</Td>
                <Td className="whitespace-nowrap tabular">
                  <a href={`tel:${l.phone}`} className="hover:underline">
                    {formatPhoneDisplay(l.phone)}
                  </a>
                </Td>
                <Td>
                  {l.property ? (
                    <Link href={`/admin/objects/${l.property.id}`} className="hover:underline">
                      {l.property.title}
                    </Link>
                  ) : (
                    t("leads.noObject")
                  )}
                </Td>
                <Td className="max-w-xs">
                  {l.comment ? <p className="line-clamp-2">{l.comment}</p> : null}
                  {brief.length ? (
                    <details className="text-xs text-ink-muted">
                      <summary className="cursor-pointer">{t("leads.brief")}</summary>
                      <p className="mt-1">{brief.join(" · ")}</p>
                    </details>
                  ) : null}
                </Td>
                <Td className="text-xs text-ink-muted">
                  <p>{source || t("leads.direct")}</p>
                  {l.pagePath ? <p className="truncate">{l.pagePath}</p> : null}
                </Td>
                <Td>
                  <LeadStatusSelect id={l.id} status={l.status} />
                </Td>
              </tr>
            );
          })
        )}
      </AdminTable>
    </>
  );
}
