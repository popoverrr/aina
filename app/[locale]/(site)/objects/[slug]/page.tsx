import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LeadFormDeferred } from "@/components/forms/LeadFormStatic";
import { CalculatorPlaceholder } from "@/components/objects/CalculatorPlaceholder";
import { ExclusiveOverlay } from "@/components/objects/ExclusiveOverlay";
import { Gallery } from "@/components/objects/Gallery";
import { ParamsTable } from "@/components/objects/ParamsTable";
import { PropertyGrid } from "@/components/objects/PropertyGrid";
import { PropertyPrice } from "@/components/objects/PropertyPrice";
import { StickyPanel } from "@/components/objects/StickyPanel";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { formatArea, formatPrice } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { getFullPropertyBySlug, getSimilarProperties, toPublicProperty } from "@/lib/properties";
import { isPropertyUnlocked } from "@/lib/unlock";
import { siteUrl } from "@/site.config";

type Props = { params: Promise<{ slug: string; locale: string }> };

const REQUEST_ID = "request";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const full = await getFullPropertyBySlug(slug);
  if (!full) return {};
  const p = toPublicProperty(full, false);
  const [t, te] = await Promise.all([getTranslations("objects.meta"), getTranslations("enums")]);
  const kind = te(`kind.${p.kind}`);
  const area = p.areaM2 !== null ? formatArea(p.areaM2) : p.areaLabel;
  const deal = te(`dealShort.${p.dealType}`);
  const price = p.priceRentTotal !== null ? formatPrice(p.priceRentTotal) : p.priceSale !== null ? formatPrice(p.priceSale) : "";

  return {
    title: t("detailTitle", { kind, area, district: p.district, deal }),
    description: p.isExclusive ? t("detailDescriptionExclusive", { kind, area, district: p.district }) : t("detailDescription", { kind, area, district: p.district, deal, price }),
    alternates: { canonical: `/objects/${p.slug}` },
  };
}

export default async function ObjectPage({ params }: Props) {
  const { slug } = await params;
  const full = await getFullPropertyBySlug(slug);
  if (!full) notFound();

  const unlocked = full.isExclusive ? await isPropertyUnlocked(full.id) : true;
  const property = toPublicProperty(full, unlocked);

  const [t, tc, te, similar] = await Promise.all([
    getTranslations("objects"),
    getTranslations("common"),
    getTranslations("enums"),
    getSimilarProperties(property.kind, property.id, 3),
  ]);

  const kind = te(`kind.${property.kind}`);
  const area = property.areaM2 !== null ? formatArea(property.areaM2) : property.areaLabel;
  const locked = property.isExclusive && !property.unlocked;
  const description = renderMarkdown(property.descriptionMd);
  const price = property.priceRentTotal ?? property.priceSale;

  return (
    <>
      <Breadcrumbs items={[{ label: tc("nav.objects"), href: "/objects" }, { label: property.title }]} />

      <article className="section-y pt-6 pb-28 md:pb-24 lg:pt-8">
        <div className="container-site">
          <header className="mb-6 max-w-3xl">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {property.isHot ? <Badge tone="hot">{tc("badges.hot")}</Badge> : null}
              {property.isExclusive ? <Badge tone="accent">{t("detail.exclusive.badge")}</Badge> : null}
              {property.status === "RESERVED" ? <Badge tone="neutral">{tc("badges.reserved")}</Badge> : null}
            </div>
            <h1>{property.title}</h1>
            <p className="mt-2 text-ink-muted">
              {kind} · {property.district} · {area}
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            <div className="space-y-10">
              <Gallery
                images={property.images}
                title={property.title}
                placeholderLabel={tc("placeholders.photo")}
                labels={{
                  aria: t("detail.gallery.aria"),
                  prev: t("detail.gallery.prev"),
                  next: t("detail.gallery.next"),
                  open: t("detail.gallery.open"),
                  close: t("detail.gallery.close"),
                  counter: t("detail.gallery.counter", { current: "{current}", total: "{total}" }),
                  thumb: t("detail.gallery.thumb", { n: "{n}" }),
                }}
                overlay={locked ? <ExclusiveOverlay targetId={REQUEST_ID} /> : undefined}
              />

              <section aria-labelledby="params-title">
                <h2 id="params-title" className="mb-4 text-xl">
                  {t("detail.params")}
                </h2>
                <ParamsTable property={property} />
              </section>

              <section aria-labelledby="desc-title">
                <h2 id="desc-title" className="mb-4 text-xl">
                  {t("detail.description")}
                </h2>
                <div className="prose-site text-ink">{description}</div>
              </section>

              {property.advantages.length ? (
                <section aria-labelledby="adv-title">
                  <h2 id="adv-title" className="mb-4 text-xl">
                    {t("detail.advantages")}
                  </h2>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {property.advantages.map((a) => (
                      <li key={a} className="flex gap-2">
                        <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <CalculatorPlaceholder />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-base border border-line bg-surface p-5 shadow-card">
                <PropertyPrice property={property} size="lg" />
                {locked ? <p className="mt-2 text-sm text-ink-muted">{t("detail.exclusive.panelText")}</p> : null}
              </div>

              <section id={REQUEST_ID} aria-labelledby="request-title" className="scroll-mt-24 rounded-base border border-line bg-surface p-5 shadow-card">
                {property.isExclusive && property.unlocked ? (
                  <>
                    <h2 id="request-title" className="text-xl">
                      {t("detail.request.unlockedTitle")}
                    </h2>
                    <p className="mt-2 text-sm text-ink-muted">{t("detail.request.unlockedText")}</p>
                    {property.presentationUrl ? (
                      <a href={property.presentationUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-medium text-accent-ink underline underline-offset-4">
                        <FileText className="size-4" aria-hidden="true" />
                        {t("detail.request.download")}
                      </a>
                    ) : null}
                  </>
                ) : (
                  <>
                    <h2 id="request-title" className="text-xl">
                      {t("detail.request.title")}
                    </h2>
                    <p className="mt-2 mb-5 text-sm text-ink-muted">{t("detail.request.text")}</p>
                    <LeadFormDeferred type="PRESENTATION" propertyId={property.id} submitLabel={t("detail.request.button")} idPrefix="request" />
                  </>
                )}
              </section>
            </aside>
          </div>

          {similar.length > 0 ? (
            <section aria-labelledby="similar-title" className="mt-16 lg:mt-24">
              <h2 id="similar-title" className="mb-6">
                {t("detail.similar")}
              </h2>
              <PropertyGrid items={similar} />
            </section>
          ) : null}
        </div>
      </article>

      <StickyPanel price={<PropertyPrice property={property} size="sm" />} label={t("detail.sticky.request")} targetId={REQUEST_ID} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: property.title,
          description: `${kind}, ${property.district}, ${area}`,
          url: `${siteUrl()}/objects/${property.slug}`,
          ...(property.cover ? { image: property.cover.url.startsWith("http") ? property.cover.url : `${siteUrl()}${property.cover.url}` } : {}),
          category: kind,
          ...(price !== null && !locked
            ? {
                offers: {
                  "@type": "Offer",
                  price,
                  priceCurrency: "KZT",
                  availability: property.status === "RESERVED" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
                  url: `${siteUrl()}/objects/${property.slug}`,
                },
              }
            : {}),
        }}
      />
    </>
  );
}
