import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import { Check, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Testimonials } from "@/components/home/Testimonials";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { FillInText, ImagePlaceholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { getContacts } from "@/lib/settings";
import { getPublicTestimonials } from "@/lib/testimonials";
import { site, whatsappLink } from "@/site.config";

export const revalidate = 60;

const WORK_PHOTOS = [1, 2, 3, 4, 5, 6] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about.meta");
  const name = site.agent.fullName.includes("[") ? site.agent.shortName : site.agent.fullName;
  return { title: t("title"), description: t("description", { name }), alternates: { canonical: "/about" } };
}

/** Полностью от первого лица, единственного числа. */
export default async function AboutPage() {
  const [t, tc, testimonials, contacts] = await Promise.all([getTranslations("about"), getTranslations("common"), getPublicTestimonials(), getContacts()]);
  const name = site.agent.fullName.includes("[") ? site.agent.shortName : site.agent.fullName;
  const wa = whatsappLink(tc("whatsappPreset")).replace(/wa\.me\/\d+/, `wa.me/${contacts.whatsapp}`);
  // Кадры с объектов кладутся в public/agent/work/1..6.jpg; пока их нет — видимая заглушка
  const photos = WORK_PHOTOS.map((n) => ({ n, exists: existsSync(path.join(process.cwd(), "public", "agent", "work", `${n}.jpg`)) }));

  return (
    <>
      <Breadcrumbs items={[{ label: tc("nav.about") }]} />

      <section className="section-y pt-6 lg:pt-8">
        <div className="container-site grid items-start gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-base bg-surface-2 shadow-card lg:sticky lg:top-24">
            <Image src="/agent/avatar.jpg" alt={t("photoAlt", { name })} fill priority sizes="(min-width: 1024px) 480px, 448px" className="object-cover" />
          </div>
          <div className="space-y-12">
            <header>
              <h1>{t("title")}</h1>
              <p className="mt-3 text-lg text-ink-muted">
                {site.agent.shortName} · {site.agent.role} · {site.agent.city}
              </p>
            </header>

            <section aria-labelledby="story-title">
              <h2 id="story-title" className="mb-4 text-xl">
                {t("story.title")}
              </h2>
              <FillInText value={t("story.text")} />
            </section>

            <section aria-labelledby="spec-title">
              <h2 id="spec-title" className="mb-4 text-xl">
                {t("specialization.title")}
              </h2>
              <p>{t("specialization.lead")}</p>
              <div className="mt-4">
                <FillInText value={t("specialization.why")} />
              </div>
            </section>

            <section aria-labelledby="principles-title">
              <h2 id="principles-title" className="mb-4 text-xl">
                {t("principles.title")}
              </h2>
              <ol className="grid gap-5 sm:grid-cols-2">
                {(["1", "2", "3", "4"] as const).map((k, i) => (
                  <li key={k} className="rounded-base border border-line p-5">
                    <p className="text-sm font-medium text-ink-muted tabular">0{i + 1}</p>
                    <h3 className="mt-1 text-base">{t(`principles.items.${k}.title`)}</h3>
                    <p className="mt-2 text-sm text-ink-muted">{t(`principles.items.${k}.text`)}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="support-title">
              <h2 id="support-title" className="mb-4 text-xl">
                {t("support.title")}
              </h2>
              <ul className="space-y-2.5">
                {(["1", "2", "3", "4", "5", "6"] as const).map((k) => (
                  <li key={k} className="flex gap-3">
                    <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{t(`support.items.${k}`)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>

      <Section tone="muted" aria-labelledby="work-title">
        <h2 id="work-title">{t("work.title")}</h2>
        <p className="mt-2 mb-8 text-ink-muted">{t("work.text")}</p>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {photos.map(({ n, exists }) => (
            <li key={n} className="relative aspect-[4/3] overflow-hidden rounded-base bg-surface">
              {exists ? (
                <Image src={`/agent/work/${n}.jpg`} alt={`${site.agent.shortName}, кадр с объекта ${n}`} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover" />
              ) : (
                <ImagePlaceholder label={tc("placeholders.workPhoto", { n })} />
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Testimonials items={testimonials} title={t("testimonials.title")} />

      <Section aria-labelledby="about-cta-title">
        <div className="rounded-base border border-line bg-surface-2 p-8 text-center lg:p-12">
          <h2 id="about-cta-title">{t("cta.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">{t("cta.text")}</p>
          <ButtonLink href={wa} external variant="whatsapp" size="lg" className="mt-6">
            <MessageCircle className="size-5" aria-hidden="true" />
            {t("cta.button")}
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
