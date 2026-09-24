import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { toAppLocale } from "@/i18n/routing";
import { formatArea, formatPrice } from "@/lib/format";
import { loadOgFont } from "@/lib/og/font";
import { getFullPropertyBySlug, toPublicProperty } from "@/lib/properties";
import { site, siteUrl } from "@/site.config";

export const alt = "Объект коммерческой недвижимости в Алматы";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Динамическая OG-картинка объекта: первое фото + тип, площадь, район, цена (для закрытых — «по запросу»). */
export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: localeParam } = await params;
  const locale = toAppLocale(localeParam);
  const [full, font, te, t] = await Promise.all([
    getFullPropertyBySlug(slug),
    loadOgFont(),
    getTranslations({ locale, namespace: "enums" }),
    getTranslations({ locale, namespace: "objects" }),
  ]);

  const p = full ? toPublicProperty(full, false) : null;
  const kind = p ? te(`kind.${p.kind}`) : "";
  const area = p ? (p.areaM2 !== null ? formatArea(p.areaM2) : p.areaLabel) : "";
  const price = p
    ? p.isExclusive
      ? t("card.priceOnRequest")
      : p.priceRentTotal !== null
        ? `${formatPrice(p.priceRentTotal)} ${t("card.perMonth")}`
        : p.priceSale !== null
          ? formatPrice(p.priceSale)
          : t("card.priceOnRequest")
    : "";
  const cover = p?.cover ? (p.cover.url.startsWith("http") ? p.cover.url : `${siteUrl()}${p.cover.url}`) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#12161C",
          color: "#FFFFFF",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 56, width: cover ? 640 : 1200 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, color: "#C9B08A", letterSpacing: 1 }}>{`${site.agent.shortName} · ${site.agent.role}`}</div>
            <div style={{ fontSize: 26, marginTop: 28, color: "#C9CED6" }}>{p ? `${kind} · ${p.district}` : ""}</div>
            <div style={{ fontSize: 52, lineHeight: 1.1, marginTop: 12, maxHeight: 240, overflow: "hidden" }}>{p ? p.title : alt}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, color: "#C9CED6" }}>{area}</div>
            <div style={{ fontSize: 40, marginTop: 6 }}>{price}</div>
          </div>
        </div>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- satori рендерит только нативный img
          <img src={cover} alt="" width={560} height={630} style={{ objectFit: "cover", width: 560, height: 630 }} />
        ) : null}
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter", data: font, weight: 600, style: "normal" }],
    },
  );
}
