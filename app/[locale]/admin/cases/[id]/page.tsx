import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CaseForm } from "@/components/admin/CaseForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/Button";
import { deleteCase, requireAdminPage } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";
import { isStorageConfigured } from "@/lib/storage";
import type { CaseFormInput } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditCasePage({ params }: Props) {
  const { id } = await params;
  await requireAdminPage(`/admin/cases/${id}`);
  const [t, item] = await Promise.all([getTranslations("admin"), prisma.case.findUnique({ where: { id } })]);
  if (!item) notFound();

  const initial: CaseFormInput = {
    title: item.title,
    slug: item.slug,
    kind: item.kind,
    dealType: item.dealType,
    district: item.district ?? "",
    areaM2: item.areaM2 === null ? "" : String(item.areaM2),
    amountLabel: item.amountLabel ?? "",
    durationLabel: item.durationLabel ?? "",
    task: item.task,
    solution: item.solution,
    result: item.result,
    isFeatured: item.isFeatured,
    order: String(item.order),
  };

  return (
    <>
      <AdminPageHeader
        title={t("cases.edit")}
        actions={
          <>
            <Link href={`/cases/${item.slug}`} className={buttonClasses("ghost", "sm")}>
              {t("nav.site")}
            </Link>
            <DeleteButton action={deleteCase.bind(null, item.id)} redirectTo="/admin/cases" />
          </>
        }
      >
        <p className="text-sm text-ink-muted">{item.title}</p>
      </AdminPageHeader>
      <AdminPanel className="max-w-3xl">
        <CaseForm id={item.id} initial={initial} coverUrl={item.coverUrl} storageReady={isStorageConfigured()} />
      </AdminPanel>
    </>
  );
}
