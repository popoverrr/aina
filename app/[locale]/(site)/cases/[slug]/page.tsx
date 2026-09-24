import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PropertyGrid } from "@/components/objects/PropertyGrid";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/Placeholder";
import { getCaseBySlug } from "@/lib/cases";
import { formatArea } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { getSimilarProperties } from "@/lib/properties";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.result.slice(0, 160),
    alternates: { canonical: `/cases/${item.slug}` },
    ...(item.coverUrl ? { openGraph: { images: [{ url: item.coverUrl }] } } : {}),
  };
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) notFound();

  const [t, tc, te, similar] = await Promise.all([
    getTranslations("cases"),
    getTranslations("common"),
    getTranslations("enums"),
    getSimilarProperties(item.kind, null, 3),
  ]);

  const facts: Array<[string, string]> = [];
  if (item.district) facts.push([t("detail.district"), item.district]);
  if (item.areaM2 !== null) facts.push([t("detail.area"), formatArea(item.areaM2)]);
  if (item.amountLabel) facts.push([t("detail.amount"), item.amountLabel]);
  if (item.durationLabel) facts.push([t("detail.duration"), item.durationLabel]);

  return (
    <>
      <Breadcrumbs items={[{ label: tc("nav.cases"), href: "/cases" }, { label: item.title }]} />
      <article className="section-y pt-6 lg:pt-8">
        <div className="container-site">
          <header className="max-w-3xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="muted">{te(`kind.${item.kind}`)}</Badge>
              <Badge tone="muted">{te(`deal.${item.dealType}`)}</Badge>
            </div>
            <h1>{item.title}</h1>
          </header>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            <div className="space-y-10">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-base bg-surface-2">
                {item.coverUrl ? (
                  <Image src={item.coverUrl} alt={t("detail.coverAlt", { title: item.title })} fill priority sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
                ) : (
                  <ImagePlaceholder label={tc("placeholders.caseCover")} />
                )}
              </div>

              {(
                [
                  ["task", item.task],
                  ["solution", item.solution],
                  ["result", item.result],
                ] as const
              ).map(([key, text]) => (
                <section key={key} aria-labelledby={`case-${key}`}>
                  <h2 id={`case-${key}`} className="mb-3 text-xl">
                    {t(`detail.${key}`)}
                  </h2>
                  <div className="prose-site">{renderMarkdown(text)}</div>
                </section>
              ))}
            </div>

            {facts.length ? (
              <aside className="lg:sticky lg:top-20 lg:self-start">
                <dl className="divide-y divide-line rounded-base border border-line bg-surface p-5 shadow-card">
                  {facts.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
                      <dt className="text-ink-muted">{label}</dt>
                      <dd className="text-right font-medium tabular">{value}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            ) : null}
          </div>

          <section aria-labelledby="similar-title" className="mt-16 lg:mt-24">
            <h2 id="similar-title" className="mb-6">
              {t("detail.similar")}
            </h2>
            {similar.length > 0 ? (
              <PropertyGrid items={similar} />
            ) : (
              <div className="rounded-base border border-dashed border-line bg-surface-2 p-8 text-center">
                <p className="text-ink-muted">{t("detail.similarEmpty")}</p>
                <ButtonLink href="/search" className="mt-5">
                  {t("detail.similarCta")}
                </ButtonLink>
              </div>
            )}
          </section>
        </div>
      </article>
    </>
  );
}
