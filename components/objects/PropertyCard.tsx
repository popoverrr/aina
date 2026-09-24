import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/ui/Placeholder";
import { PropertyPrice } from "@/components/objects/PropertyPrice";
import { formatArea } from "@/lib/format";
import type { PublicPropertyCard } from "@/lib/properties";

interface PropertyCardProps {
  property: PublicPropertyCard;
  priority?: boolean;
  /** Уровень заголовка карточки: h2 в каталоге (под h1), h3 внутри секций с h2 */
  headingLevel?: "h2" | "h3";
}

/** Карточка объекта в списке: фото 4:3, бейджи, тип и район, площадь, цена, 2 преимущества. */
export function PropertyCard({ property, priority = false, headingLevel = "h3" }: PropertyCardProps) {
  const t = useTranslations("objects");
  const tc = useTranslations("common");
  const te = useTranslations("enums");
  const Heading = headingLevel;
  const kind = te(`kind.${property.kind}`);
  const area = property.areaM2 !== null ? formatArea(property.areaM2) : property.areaLabel;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-base border border-line bg-surface shadow-card transition-[border-color,box-shadow] hover:border-ink-muted/60 focus-within:border-accent">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
        {property.cover ? (
          <Image
            src={property.cover.url}
            alt={property.cover.alt || t("card.imageAlt", { kind, area, district: property.district })}
            fill
            sizes="(min-width: 1024px) 373px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={priority}
          />
        ) : (
          <ImagePlaceholder label={tc("placeholders.photo")} />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {property.isHot ? <Badge tone="hot">{tc("badges.hot")}</Badge> : null}
          {property.isExclusive ? <Badge tone="accent">{tc("badges.exclusive")}</Badge> : null}
          {property.status === "RESERVED" ? <Badge tone="neutral">{tc("badges.reserved")}</Badge> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm text-ink-muted">
          {kind} · {property.district}
        </p>
        <Heading className="text-base leading-snug font-semibold">
          <Link
            href={`/objects/${property.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {property.title}
          </Link>
        </Heading>
        <p className="text-sm tabular">{area}</p>
        <PropertyPrice property={property} size="sm" />
        {property.advantages.length ? (
          <ul className="mt-1 space-y-1 text-sm text-ink-muted">
            {property.advantages.slice(0, 2).map((a) => (
              <li key={a} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
