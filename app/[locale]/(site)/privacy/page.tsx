import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { HighlightPlaceholders } from "@/components/ui/Placeholder";
import { formatDate } from "@/lib/format";
import { getContacts } from "@/lib/settings";
import { site } from "@/site.config";

export const revalidate = 3600;

/** Дата актуальной редакции политики — менять при изменении текста. */
const POLICY_UPDATED = "2026-09-15";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy.meta");
  return { title: t("title"), description: t("description"), alternates: { canonical: "/privacy" }, robots: { index: false, follow: true } };
}

export default async function PrivacyPage() {
  const [t, tc, contacts] = await Promise.all([getTranslations("privacy"), getTranslations("common"), getContacts()]);
  const sections = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

  return (
    <>
      <Breadcrumbs items={[{ label: tc("nav.privacy") }]} />
      <article className="section-y pt-6 lg:pt-8">
        <div className="container-site max-w-3xl">
          <h1>{t("title")}</h1>
          <p className="mt-2 text-sm text-ink-muted">{t("updated", { date: formatDate(POLICY_UPDATED) })}</p>
          <div className="mt-8 space-y-8">
            {sections.map((k) => (
              <section key={k} aria-labelledby={`privacy-${k}`}>
                <h2 id={`privacy-${k}`} className="text-xl">
                  {t(`sections.${k}.title`)}
                </h2>
                <p className="mt-2 text-ink">
                  <HighlightPlaceholders text={t(`sections.${k}.text`, { domain: site.site.domain, entity: site.legal.entity, email: contacts.email })} />
                </p>
              </section>
            ))}
          </div>
        </div>
      </article>
    </>
  );
}
