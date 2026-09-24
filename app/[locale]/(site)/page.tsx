import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CaseCard } from "@/components/cases/CaseCard";
import { LeadFormDeferred } from "@/components/forms/LeadFormStatic";
import { GoldenSquare } from "@/components/home/GoldenSquare";
import { Hero } from "@/components/home/Hero";
import { HowIWork } from "@/components/home/HowIWork";
import { Stats } from "@/components/home/Stats";
import { Testimonials } from "@/components/home/Testimonials";
import { WhoIHelp } from "@/components/home/WhoIHelp";
import { PropertyGrid } from "@/components/objects/PropertyGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getFeaturedCases } from "@/lib/cases";
import { countObjectsInWork, getHotProperties } from "@/lib/properties";
import { getContacts, getSiteSettings } from "@/lib/settings";
import { getPublicTestimonials } from "@/lib/testimonials";
import { instagramLink, isPlaceholder, site, siteUrl } from "@/site.config";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home.meta");
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [t, ta, settings, contacts, hot, cases, testimonials, objectsCount] = await Promise.all([
    getTranslations("home"),
    getTranslations("common.actions"),
    getSiteSettings(),
    getContacts(),
    getHotProperties(3),
    getFeaturedCases(3),
    getPublicTestimonials(),
    countObjectsInWork(),
  ]);

  const name = site.agent.fullName.includes("[") ? site.agent.shortName : site.agent.fullName;

  return (
    <>
      <Hero title={settings.hero.title} subtitle={settings.hero.subtitle} />

      <Stats
        values={{
          years: settings.stats.years ?? site.agent.yearsInMarket,
          volume: settings.stats.volume ?? site.agent.closedVolume,
          objects: settings.stats.objects ?? objectsCount,
          avgDeal: settings.stats.avgDeal ?? site.agent.avgDealDuration,
        }}
      />

      {hot.length > 0 ? (
        <Section aria-labelledby="hot-title">
          <SectionHeader
            title={<span id="hot-title">{t("hot.title")}</span>}
            subtitle={t("hot.subtitle")}
            action={
              <ButtonLink href="/objects" variant="secondary" size="sm">
                {ta("allObjects")} →
              </ButtonLink>
            }
          />
          <PropertyGrid items={hot} />
        </Section>
      ) : null}

      {cases.length > 0 ? (
        <Section tone={hot.length > 0 ? "muted" : "default"} aria-labelledby="cases-title">
          <SectionHeader
            title={<span id="cases-title">{t("cases.title")}</span>}
            subtitle={t("cases.subtitle")}
            action={
              <ButtonLink href="/cases" variant="secondary" size="sm">
                {ta("allCases")} →
              </ButtonLink>
            }
          />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <li key={c.id}>
                <CaseCard item={c} withCover={false} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <GoldenSquare text={settings.golden.text} />
      <HowIWork />
      <WhoIHelp />
      <Testimonials items={testimonials} title={t("testimonials.title")} />

      <Section aria-labelledby="home-form-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <h2 id="home-form-title">{t("form.title")}</h2>
            <p className="mt-3 text-ink-muted">{t("form.text")}</p>
          </div>
          <LeadFormDeferred type="CONTACT" compact note={t("form.note")} idPrefix="home" />
        </div>
      </Section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name,
          description: site.agent.tagline,
          url: siteUrl(),
          image: `${siteUrl()}/agent/avatar.jpg`,
          telephone: contacts.phone,
          ...(isPlaceholder(contacts.email) ? {} : { email: contacts.email }),
          areaServed: { "@type": "City", name: site.agent.city },
          address: { "@type": "PostalAddress", addressLocality: site.agent.city, addressCountry: "KZ" },
          sameAs: [instagramLink(contacts.instagram)],
        }}
      />
    </>
  );
}
