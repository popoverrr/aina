import Image from "next/image";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/site.config";

/**
 * Первый экран: две колонки — текст слева, портрет справа (940×1254), на мобильном портрет под текстом.
 * Без слайдеров, видеофонов и обратного отсчёта. Фото — priority + sizes.
 */
export function Hero({ title, subtitle }: { title?: string; subtitle?: string }) {
  const t = useTranslations("home.hero");
  const name = site.agent.fullName.includes("[") ? site.agent.shortName : site.agent.fullName;

  return (
    <section className="border-b border-line bg-surface-2">
      <div className="container-site grid items-center gap-10 py-12 md:grid-cols-[1.15fr_1fr] md:py-16 lg:gap-16 lg:py-20">
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-medium text-accent-ink">
            {site.agent.shortName} · {site.agent.role} · {site.agent.city}
          </p>
          <h1>{title ?? t("title")}</h1>
          <p className="mt-5 text-lg text-ink-muted">{subtitle ?? t("subtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/search" size="lg">
              {t("primary")}
            </ButtonLink>
            <ButtonLink href="/objects" variant="secondary" size="lg">
              {t("secondary")}
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm md:max-w-none">
          <div className="relative aspect-[3/4] overflow-hidden rounded-base bg-accent/10 shadow-card">
            <Image
              src="/agent/hero.jpg"
              alt={t("photoAlt", { name })}
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 480px, (min-width: 768px) 45vw, 384px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
