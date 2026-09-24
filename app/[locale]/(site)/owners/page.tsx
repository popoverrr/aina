import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CaseCard } from "@/components/cases/CaseCard";
import { ConsentText } from "@/components/forms/ConsentText";
import { OwnerForm } from "@/components/forms/OwnerForm";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { FillInText } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { getRentCases } from "@/lib/cases";

export const revalidate = 60;

const FORM_ID = "owner-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("owners.meta");
  return { title: t("title"), description: t("description"), alternates: { canonical: "/owners" } };
}

/** Посадочная для собственников: здесь не выбирают объект, здесь решают, кому доверить свой. */
export default async function OwnersPage() {
  const [t, tc, cases] = await Promise.all([getTranslations("owners"), getTranslations("common"), getRentCases(3)]);

  return (
    <>
      <Breadcrumbs items={[{ label: tc("nav.owners") }]} />

      <section className="section-y pt-6 lg:pt-8">
        <div className="container-site max-w-3xl">
          <h1>{t("title")}</h1>
          <p className="mt-4 text-lg text-ink-muted">{t("subtitle")}</p>
          <ButtonLink href={`#${FORM_ID}`} size="lg" className="mt-8">
            {t("cta")}
          </ButtonLink>
        </div>
      </section>

      <Section tone="muted" aria-labelledby="why-title">
        <h2 id="why-title">{t("why.title")}</h2>
        <p className="mt-3 max-w-2xl text-lg">{t("why.lead")}</p>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {(["1", "2", "3", "4"] as const).map((k) => (
            <li key={k} className="rounded-base border border-line bg-surface p-6 shadow-card">
              <h3>{t(`why.items.${k}.title`)}</h3>
              <p className="mt-2 text-sm text-ink-muted">{t(`why.items.${k}.text`)}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-labelledby="scope-title">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="scope-title">{t("scope.title")}</h2>
            <ul className="mt-6 space-y-3">
              {(["1", "2", "3", "4", "5", "6"] as const).map((k) => (
                <li key={k} className="flex gap-3">
                  <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span>{t(`scope.items.${k}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-base border border-line bg-surface-2 p-6 lg:p-8">
            <h2 className="text-xl">{t("commission.title")}</h2>
            <div className="mt-3">
              <FillInText value={t("commission.text")} />
            </div>
          </div>
        </div>
      </Section>

      <Section tone="muted" aria-labelledby="rent-cases-title">
        <h2 id="rent-cases-title" className="mb-8">
          {t("cases.title")}
        </h2>
        {cases.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <li key={c.id}>
                <CaseCard item={c} withCover={false} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted">{t("cases.empty")}</p>
        )}
      </Section>

      <Section aria-labelledby="owner-form-title" id={FORM_ID} className="scroll-mt-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <h2 id="owner-form-title">{t("form.title")}</h2>
            <p className="mt-3 text-ink-muted">{t("form.text")}</p>
          </div>
          <OwnerForm submitLabel={t("form.title")} note={t("form.note")} consent={<ConsentText />} />
        </div>
      </Section>
    </>
  );
}
