import { useTranslations } from "next-intl";
import { formatArea, formatNumber, formatPrice, formatPricePerM2 } from "@/lib/format";
import type { PublicPropertyDetail } from "@/lib/properties";

/** Ключевые параметры таблицей. Пустые поля не выводятся. Для закрытых — ориентир вместо адреса, цена «по запросу». */
export function ParamsTable({ property }: { property: PublicPropertyDetail }) {
  const t = useTranslations("objects.detail.table");
  const to = useTranslations("objects");
  const te = useTranslations("enums");
  const tc = useTranslations("common");

  const rows: Array<[string, string]> = [];
  rows.push([t("kind"), te(`kind.${property.kind}`)]);
  rows.push([t("deal"), te(`deal.${property.dealType}`)]);
  rows.push([t("district"), property.district]);
  if (property.address) rows.push([t("address"), property.address]);
  if (property.landmark) rows.push([t("landmark"), property.landmark]);
  rows.push([t("area"), property.areaM2 !== null ? formatArea(property.areaM2) : property.areaLabel]);
  if (property.ceilingM !== null) rows.push([t("ceiling"), t("meters", { value: formatNumber(property.ceilingM, 1) })]);
  if (property.floor) rows.push([t("floor"), property.floor]);
  if (property.entrance) rows.push([t("entrance"), property.entrance]);
  if (property.powerKw !== null) rows.push([t("power"), t("kw", { value: formatNumber(property.powerKw) })]);
  rows.push([t("wetPoint"), property.hasWetPoint ? tc("yes") : tc("no")]);

  const hidden = property.isExclusive && !property.unlocked;
  if (hidden) {
    rows.push([property.dealType === "SALE" ? t("priceSale") : t("priceRent"), to("detail.exclusive.priceOnRequest")]);
  } else {
    if (property.priceSale !== null) rows.push([t("priceSale"), formatPrice(property.priceSale)]);
    if (property.priceRentTotal !== null) rows.push([t("priceRent"), formatPrice(property.priceRentTotal)]);
    if (property.priceRentM2 !== null) rows.push([t("priceRentM2"), formatPricePerM2(property.priceRentM2)]);
    if (property.dealType !== "SALE") rows.push([t("utilities"), property.utilitiesIncluded ? t("utilitiesIncluded") : t("utilitiesExcluded")]);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-line last:border-b-0">
              <th scope="row" className="w-1/2 py-2.5 pr-4 text-left font-normal text-ink-muted">
                {label}
              </th>
              <td className="py-2.5 font-medium tabular">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
