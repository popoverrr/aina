import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ConsentText } from "@/components/forms/ConsentText";
import { SearchBriefForm } from "@/components/forms/SearchBriefForm";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search.meta");
  return { title: t("title"), description: t("description"), alternates: { canonical: "/search" } };
}

export default async function SearchPage() {
  const [t, tc] = await Promise.all([getTranslations("search"), getTranslations("common")]);
  return (
    <>
      <Breadcrumbs items={[{ label: tc("nav.search") }]} />
      <section className="section-y pt-6 lg:pt-8">
        <div className="container-site max-w-4xl">
          <div className="mb-10 max-w-2xl">
            <h1>{t("title")}</h1>
            <p className="mt-3 text-ink-muted">{t("intro")}</p>
          </div>
          <SearchBriefForm consent={<ConsentText />} />
        </div>
      </section>
    </>
  );
}
