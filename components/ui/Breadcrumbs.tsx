import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteUrl } from "@/site.config";
import { JsonLd } from "@/components/seo/JsonLd";

export interface Crumb {
  label: string;
  href?: string;
}

/** Хлебные крошки + JSON-LD BreadcrumbList. Первый элемент — всегда «Главная». */
export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = await getTranslations("common.breadcrumbs");
  const all: Crumb[] = [{ label: t("home"), href: "/" }, ...items];
  const base = siteUrl();

  return (
    <nav aria-label={t("aria")} className="container-site pt-6 text-sm text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((item, index) => {
          const isLast = index === all.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="size-3.5 opacity-60" aria-hidden="true" /> : null}
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-ink" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-ink hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(item.href ? { item: `${base}${item.href}` } : {}),
          })),
        }}
      />
    </nav>
  );
}
