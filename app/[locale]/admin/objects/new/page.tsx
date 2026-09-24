import { getTranslations } from "next-intl/server";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { AdminPageHeader, AdminPanel, Notice } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function NewObjectPage() {
  await requireAdminPage("/admin/objects/new");
  const t = await getTranslations("admin");
  return (
    <>
      <AdminPageHeader title={t("objects.new")} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <AdminPanel>
          <PropertyForm id={null} />
        </AdminPanel>
        <AdminPanel title={t("objects.groups.photos")} className="self-start">
          <Notice>{t("objects.photos.saveFirst")}</Notice>
        </AdminPanel>
      </div>
    </>
  );
}
