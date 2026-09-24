import Image from "next/image";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdminPageHeader, AdminTable, Td, Th } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/Button";
import { requireAdminPage } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage() {
  await requireAdminPage("/admin/cases");
  const [t, te, items] = await Promise.all([
    getTranslations("admin"),
    getTranslations("enums"),
    prisma.case.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
  ]);

  return (
    <>
      <AdminPageHeader
        title={t("cases.title")}
        actions={
          <Link href="/admin/cases/new" className={buttonClasses("primary", "md")}>
            <Plus className="size-4" aria-hidden="true" />
            {t("cases.new")}
          </Link>
        }
      />
      <AdminTable
        head={
          <>
            <Th>{t("cases.columns.cover")}</Th>
            <Th>{t("cases.columns.title")}</Th>
            <Th>{t("cases.columns.kind")}</Th>
            <Th>{t("cases.columns.deal")}</Th>
            <Th>{t("cases.columns.featured")}</Th>
            <Th>{t("cases.columns.order")}</Th>
          </>
        }
      >
        {items.length === 0 ? (
          <tr>
            <Td className="text-ink-muted">{t("common.empty")}</Td>
          </tr>
        ) : (
          items.map((c) => (
            <tr key={c.id} className="hover:bg-surface-2/60">
              <Td>
                <div className="relative h-12 w-20 overflow-hidden rounded-base bg-surface-2">
                  {c.coverUrl ? <Image src={c.coverUrl} alt="" fill sizes="80px" className="object-cover" /> : null}
                </div>
              </Td>
              <Td>
                <Link href={`/admin/cases/${c.id}`} className="font-medium hover:underline">
                  {c.title}
                </Link>
              </Td>
              <Td>{te(`kind.${c.kind}`)}</Td>
              <Td>{te(`deal.${c.dealType}`)}</Td>
              <Td>{c.isFeatured ? t("common.yes") : t("common.no")}</Td>
              <Td className="tabular">{c.order}</Td>
            </tr>
          ))
        )}
      </AdminTable>
    </>
  );
}
