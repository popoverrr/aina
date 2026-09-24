import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { CatalogFilters, type CatalogFiltersLabels } from "@/components/objects/CatalogFilters";
import { PropertyGrid, PropertyGridSkeleton } from "@/components/objects/PropertyGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { PROP_KINDS } from "@/lib/enums";
import {
  CATALOG_SORTS,
  filtersToSearchParams,
  hasActiveFilters,
  PAGE_SIZE,
  parseCatalogFilters,
  searchProperties,
  type CatalogFilters as Filters,
  type CatalogSort,
  type SearchParamsInput,
} from "@/lib/properties";

type Props = { searchParams: Promise<SearchParamsInput> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [t, sp] = await Promise.all([getTranslations("objects.meta"), searchParams]);
  const filtered = hasActiveFilters(parseCatalogFilters(sp));
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/objects" },
    // Комбинации фильтров не индексируем — индексируется только /objects
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

const SORT_LABEL_KEYS: Record<CatalogSort, "sortHot" | "sortPriceAsc" | "sortPriceDesc" | "sortAreaDesc" | "sortDate"> = {
  hot: "sortHot",
  price_asc: "sortPriceAsc",
  price_desc: "sortPriceDesc",
  area_desc: "sortAreaDesc",
  date: "sortDate",
};

export default async function ObjectsPage({ searchParams }: Props) {
  const [t, tc, te, sp] = await Promise.all([getTranslations("objects"), getTranslations("common"), getTranslations("enums"), searchParams]);
  const filters = parseCatalogFilters(sp);
  const key = filtersToSearchParams(filters).toString();
  const { total } = await searchProperties({ ...filters, limit: PAGE_SIZE });

  const labels: CatalogFiltersLabels = {
    title: t("filters.title"),
    deal: t("filters.deal"),
    dealAny: t("filters.dealAny"),
    dealOptions: [
      { value: "RENT", label: te("deal.RENT") },
      { value: "SALE", label: te("deal.SALE") },
    ],
    kind: t("filters.kind"),
    kindAny: t("filters.kindAny"),
    kindOptions: PROP_KINDS.map((k) => ({ value: k, label: te(`kind.${k}`) })),
    district: t("filters.district"),
    area: t("filters.area"),
    from: t("filters.from"),
    to: t("filters.to"),
    budget: t("filters.budget"),
    budgetHint: t("filters.budgetHint"),
    onlyHot: t("filters.onlyHot"),
    firstLine: t("filters.firstLine"),
    sort: t("filters.sort"),
    sortOptions: CATALOG_SORTS.map((s) => ({ value: s, label: t(`filters.${SORT_LABEL_KEYS[s]}`) })),
    reset: t("filters.reset"),
    open: t("filters.open"),
    close: t("filters.close"),
    count: t("count", { count: total }),
  };

  return (
    <>
      <Breadcrumbs items={[{ label: tc("nav.objects") }]} />
      <section className="section-y pt-6 lg:pt-8">
        <div className="container-site">
          <div className="mb-8 max-w-2xl">
            <h1>{t("title")}</h1>
            <p className="mt-3 text-ink-muted">{t("intro")}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <CatalogFilters filters={filters} labels={labels} />
            <div>
              <p className="mb-4 hidden text-sm text-ink-muted tabular lg:block" aria-live="polite">
                {labels.count}
              </p>
              <Suspense key={key} fallback={<PropertyGridSkeleton />}>
                <Results filters={filters} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

async function Results({ filters }: { filters: Filters }) {
  const t = await getTranslations("objects");
  const { items, total } = await searchProperties(filters);

  if (items.length === 0) {
    return (
      <div className="rounded-base border border-dashed border-line bg-surface-2 p-8 text-center">
        <p className="text-ink-muted">{t("empty.text")}</p>
        <ButtonLink href="/search" className="mt-5">
          {t("empty.cta")}
        </ButtonLink>
      </div>
    );
  }

  const hasMore = total > items.length;
  const moreQs = filtersToSearchParams(filters, { limit: filters.limit + PAGE_SIZE }).toString();

  return (
    <div>
      <PropertyGrid items={items} priorityCount={3} headingLevel="h2" />
      {hasMore ? (
        <div className="mt-8 text-center">
          <Link href={`/objects?${moreQs}`} scroll={false} className={buttonClasses("secondary", "md")}>
            {t("showMore")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
