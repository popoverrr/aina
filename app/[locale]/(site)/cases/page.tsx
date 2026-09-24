import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CaseCard } from "@/components/cases/CaseCard";
import { CasesGrid } from "@/components/cases/CasesGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getAllCases } from "@/lib/cases";
import { PROP_KINDS } from "@/lib/enums";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cases.meta");
  return { title: t("title"), description: t("description"), alternates: { canonical: "/cases" } };
}

export default async function CasesPage() {
  const [t, tc, te, cases] = await Promise.all([getTranslations("cases"), getTranslations("common"), getTranslations("enums"), getAllCases()]);

  const kinds = PROP_KINDS.filter((k) => cases.some((c) => c.kind === k)).map((k) => ({ value: k, label: te(`kind.${k}`) }));
  const items = cases.map((c) => ({ id: c.id, kind: c.kind, node: <CaseCard item={c} headingLevel="h2" /> }));

  return (
    <>
      <Breadcrumbs items={[{ label: tc("nav.cases") }]} />
      <section className="section-y pt-6 lg:pt-8">
        <div className="container-site">
          <div className="mb-8 max-w-2xl">
            <h1>{t("title")}</h1>
            <p className="mt-3 text-ink-muted">{t("intro")}</p>
          </div>
          <CasesGrid items={items} kinds={kinds} labels={{ filterLabel: t("filter.label"), all: t("filter.all"), empty: t("empty") }} />
        </div>
      </section>
    </>
  );
}
