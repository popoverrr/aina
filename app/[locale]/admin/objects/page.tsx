import Image from "next/image";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { QuickFlags, QuickStatus } from "@/components/admin/QuickActions";
import { AdminPageHeader, AdminTable, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { requireAdminPage } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";
import { formatArea, formatDate, formatPrice } from "@/lib/format";
import { PROP_STATUSES } from "@/lib/validation/admin";
import type { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function AdminObjectsPage({ searchParams }: Props) {
  await requireAdminPage("/admin/objects");
  const [t, te, sp] = await Promise.all([getTranslations("admin"), getTranslations("enums"), searchParams]);
  const q = (sp.q ?? "").trim();
  const status = (PROP_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as (typeof PROP_STATUSES)[number]) : undefined;

  const where: Prisma.PropertyWhereInput = {
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    ...(status ? { status } : {}),
  };
  const items = await prisma.property.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 300,
    select: {
      id: true,
      title: true,
      kind: true,
      district: true,
      areaM2: true,
      priceSale: true,
      priceRentTotal: true,
      status: true,
      isHot: true,
      isFeatured: true,
      isExclusive: true,
      updatedAt: true,
      images: { take: 1, orderBy: { order: "asc" }, select: { url: true, alt: true } },
    },
  });

  const inputClass = "h-10 rounded-base border border-line bg-surface px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none";

  return (
    <>
      <AdminPageHeader
        title={t("objects.title")}
        actions={
          <Link href="/admin/objects/new" className={buttonClasses("primary", "md")}>
            <Plus className="size-4" aria-hidden="true" />
            {t("objects.new")}
          </Link>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          {t("common.search")}
          <input type="search" name="q" defaultValue={q} placeholder={t("objects.filter.searchPlaceholder")} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          {t("objects.filter.status")}
          <select name="status" defaultValue={status ?? ""} className={inputClass}>
            <option value="">{t("common.all")}</option>
            {PROP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {te(`status.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonClasses("secondary", "sm")}>
          {t("common.search")}
        </button>
      </form>

      <AdminTable
        head={
          <>
            <Th>{t("objects.columns.photo")}</Th>
            <Th>{t("objects.columns.title")}</Th>
            <Th>{t("objects.columns.kind")}</Th>
            <Th>{t("objects.columns.district")}</Th>
            <Th>{t("objects.columns.area")}</Th>
            <Th>{t("objects.columns.price")}</Th>
            <Th>{t("objects.columns.status")}</Th>
            <Th>{t("objects.columns.flags")}</Th>
            <Th>{t("objects.columns.date")}</Th>
          </>
        }
      >
        {items.length === 0 ? (
          <tr>
            <Td className="text-ink-muted">{t("common.empty")}</Td>
          </tr>
        ) : (
          items.map((p) => {
            const cover = p.images[0];
            const price = p.priceRentTotal ? formatPrice(p.priceRentTotal.toNumber()) : p.priceSale ? formatPrice(p.priceSale.toNumber()) : "—";
            return (
              <tr key={p.id} className="hover:bg-surface-2/60">
                <Td>
                  <div className="relative size-12 overflow-hidden rounded-base bg-surface-2">
                    {cover ? <Image src={cover.url} alt="" fill sizes="48px" className="object-cover" /> : null}
                  </div>
                </Td>
                <Td>
                  <Link href={`/admin/objects/${p.id}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  {p.isExclusive ? (
                    <span className="ml-2">
                      <Badge tone="accent">{t("objects.flags.exclusive")}</Badge>
                    </span>
                  ) : null}
                </Td>
                <Td>{te(`kind.${p.kind}`)}</Td>
                <Td>{p.district}</Td>
                <Td className="tabular">{formatArea(p.areaM2)}</Td>
                <Td className="tabular">{price}</Td>
                <Td>
                  <QuickStatus id={p.id} status={p.status} />
                </Td>
                <Td>
                  <QuickFlags id={p.id} isHot={p.isHot} isFeatured={p.isFeatured} />
                </Td>
                <Td className="text-ink-muted tabular">{formatDate(p.updatedAt)}</Td>
              </tr>
            );
          })
        )}
      </AdminTable>
    </>
  );
}
