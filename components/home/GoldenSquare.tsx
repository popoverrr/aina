import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { FillInText } from "@/components/ui/Placeholder";

/** Блок специализации: схематичная карта района инлайн-SVG (не картинка, не Google Maps) + текст. */
export function GoldenSquare({ text }: { text?: string }) {
  const t = useTranslations("home.golden");

  return (
    <Section tone="muted" aria-labelledby="golden-title">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 id="golden-title">{t("title")}</h2>
          <p className="mt-4 text-lg">{t("lead")}</p>
          <div className="mt-4 text-ink-muted">
            <FillInText value={text ?? t("text")} />
          </div>
        </div>

        <figure className="mx-auto w-full max-w-md lg:max-w-none">
          <svg viewBox="0 0 480 400" role="img" aria-label={t("mapAria")} className="h-auto w-full">
            <rect width="480" height="400" fill="var(--color-surface)" rx="8" />
            {/* сетка улиц */}
            <g stroke="var(--color-line)" strokeWidth="2">
              {[60, 120, 180, 240, 300, 360, 420].map((x) => (
                <line key={`v${x}`} x1={x} y1="20" x2={x} y2="340" />
              ))}
              {[60, 110, 160, 210, 260, 310].map((y) => (
                <line key={`h${y}`} x1="20" y1={y} x2="460" y2={y} />
              ))}
            </g>
            {/* магистрали */}
            <g stroke="var(--color-ink-muted)" strokeWidth="3" strokeLinecap="round">
              <line x1="20" y1="310" x2="460" y2="310" />
              <line x1="20" y1="60" x2="460" y2="60" />
              <line x1="120" y1="20" x2="120" y2="340" />
              <line x1="360" y1="20" x2="360" y2="340" />
            </g>
            {/* золотой квадрат */}
            <rect x="120" y="60" width="240" height="250" fill="var(--color-accent)" fillOpacity="0.14" stroke="var(--color-accent)" strokeWidth="3" rx="4" />
            <text x="240" y="190" textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--color-accent-ink)">
              {t("title")}
            </text>
            {/* подписи */}
            <text x="240" y="332" textAnchor="middle" fontSize="12" fill="var(--color-ink-muted)">
              пр. Абая
            </text>
            <text x="240" y="50" textAnchor="middle" fontSize="12" fill="var(--color-ink-muted)">
              север · центр города
            </text>
            {/* горы на юге */}
            <g fill="var(--color-line)">
              <polygon points="40,392 100,352 160,392" />
              <polygon points="140,392 220,342 300,392" />
              <polygon points="280,392 340,356 400,392" />
              <polygon points="380,392 430,362 470,392" />
            </g>
            <text x="240" y="384" textAnchor="middle" fontSize="11" fill="var(--color-ink-muted)">
              юг · горы
            </text>
          </svg>
          <figcaption className="mt-2 text-xs text-ink-muted">{t("mapCaption")}</figcaption>
        </figure>
      </div>
    </Section>
  );
}
