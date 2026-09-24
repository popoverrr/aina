import { getTranslations } from "next-intl/server";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { TestimonialsEditor } from "@/components/admin/TestimonialsEditor";
import { AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";
import { SETTING_KEYS } from "@/lib/settings";
import type { SettingsFormInput } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

function group(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) if (typeof v === "string") out[k] = v;
  return out;
}

export default async function AdminSettingsPage() {
  await requireAdminPage("/admin/settings");
  const [t, rows, testimonials] = await Promise.all([
    getTranslations("admin"),
    prisma.setting.findMany({ where: { key: { in: [...SETTING_KEYS] } } }),
    prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
  ]);

  const byKey = Object.fromEntries(rows.map((r) => [r.key, group(r.value)]));
  const g = (key: string) => byKey[key] ?? {};
  const initial: SettingsFormInput = {
    hero: { title: g("hero").title ?? "", subtitle: g("hero").subtitle ?? "" },
    stats: { years: g("stats").years ?? "", volume: g("stats").volume ?? "", objects: g("stats").objects ?? "", avgDeal: g("stats").avgDeal ?? "" },
    contacts: {
      phone: g("contacts").phone ?? "",
      whatsapp: g("contacts").whatsapp ?? "",
      telegram: g("contacts").telegram ?? "",
      instagram: g("contacts").instagram ?? "",
      email: g("contacts").email ?? "",
    },
    golden: { text: g("golden").text ?? "" },
  };

  return (
    <>
      <AdminPageHeader title={t("settings.title")} />
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel>
          <SettingsForm initial={initial} />
        </AdminPanel>
        <AdminPanel title={t("settings.testimonials.title")} className="self-start">
          <TestimonialsEditor items={testimonials} />
        </AdminPanel>
      </div>
    </>
  );
}
