import { getTranslations } from "next-intl/server";
import { CaseForm } from "@/components/admin/CaseForm";
import { AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/actions/admin";
import { isStorageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  await requireAdminPage("/admin/cases/new");
  const t = await getTranslations("admin");
  return (
    <>
      <AdminPageHeader title={t("cases.new")} />
      <AdminPanel className="max-w-3xl">
        <CaseForm id={null} storageReady={isStorageConfigured()} />
      </AdminPanel>
    </>
  );
}
