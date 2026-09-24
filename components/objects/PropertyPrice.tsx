import { useTranslations } from "next-intl";
import { formatPrice, formatPricePerM2 } from "@/lib/format";
import type { PublicPropertyCard } from "@/lib/properties";
import { cn } from "@/lib/cn";

type PriceSource = Pick<PublicPropertyCard, "dealType" | "isExclusive" | "priceSale" | "priceRentTotal" | "priceRentM2">;

/** Единственный способ показать цену объекта — все ветки (аренда/продажа/по запросу) здесь. */
export function PropertyPrice({ property, size = "md", className }: { property: PriceSource; size?: "sm" | "md" | "lg"; className?: string }) {
  const t = useTranslations("objects");
  const main = size === "lg" ? "text-2xl font-semibold" : size === "sm" ? "text-base font-semibold" : "text-lg font-semibold";
  const sub = "text-sm text-ink-muted";

  // Для закрытого объекта до заявки сервер отдаёт цены как null — показываем «по запросу»; после заявки цены реальные.
  const onRequest = property.priceSale === null && property.priceRentTotal === null && property.priceRentM2 === null;
  if (onRequest) {
    return <p className={cn(main, "tabular", className)}>{t("card.priceOnRequest")}</p>;
  }

  const rent = property.priceRentTotal !== null ? formatPrice(property.priceRentTotal) : property.priceRentM2 !== null ? formatPricePerM2(property.priceRentM2) : null;
  const sale = property.priceSale !== null ? formatPrice(property.priceSale) : null;

  return (
    <div className={cn("tabular", className)}>
      {property.dealType !== "SALE" && rent ? (
        <p className={main}>
          {rent}
          <span className={cn(sub, "ml-1.5 font-normal")}>{property.priceRentTotal !== null ? t("card.perMonth") : ""}</span>
        </p>
      ) : null}
      {property.dealType !== "RENT" && sale ? <p className={property.dealType === "BOTH" && rent ? sub : main}>{sale}</p> : null}
      {property.dealType !== "SALE" && property.priceRentTotal !== null && property.priceRentM2 !== null ? <p className={sub}>{formatPricePerM2(property.priceRentM2)}</p> : null}
    </div>
  );
}
