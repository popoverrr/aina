import { ArrowRight, KeyRound, Store, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Section, SectionHeader } from "@/components/ui/Section";

const CARDS = [
  { key: "investor", href: "/objects", Icon: TrendingUp },
  { key: "tenant", href: "/search", Icon: Store },
  { key: "owner", href: "/owners", Icon: KeyRound },
] as const;

/** Кому я помогаю: 3 карточки со ссылками, у каждой — формулировка боли в одну строку. */
export function WhoIHelp() {
  const t = useTranslations("home.who");
  return (
    <Section tone="muted" aria-labelledby="who-title">
      <SectionHeader title={<span id="who-title">{t("title")}</span>} />
      <ul className="grid gap-6 md:grid-cols-3">
        {CARDS.map(({ key, href, Icon }) => (
          <li key={key}>
            <Link
              href={href}
              className="group flex h-full flex-col gap-4 rounded-base border border-line bg-surface p-6 shadow-card transition-[border-color] hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Icon className="size-6 text-accent" aria-hidden="true" />
              <h3>{t(`${key}.title`)}</h3>
              <p className="text-sm text-ink-muted">{t(`${key}.pain`)}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-accent-ink group-hover:underline">
                {t(`${key}.cta`)}
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
