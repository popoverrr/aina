import type { Metadata } from "next";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LeadSubmitEvent } from "@/components/forms/LeadSubmitEvent";
import { ButtonLink } from "@/components/ui/Button";
import { getContacts } from "@/lib/settings";
import { LEAD_TYPES } from "@/lib/enums";
import { whatsappLink } from "@/site.config";

type Props = { searchParams: Promise<{ type?: string | string[] }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("thanks.meta");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function ThanksPage({ searchParams }: Props) {
  const [t, tc, contacts, sp] = await Promise.all([getTranslations("thanks"), getTranslations("common"), getContacts(), searchParams]);
  const raw = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const type = (LEAD_TYPES as readonly string[]).includes(raw ?? "") ? (raw as (typeof LEAD_TYPES)[number]) : "CONTACT";
  const wa = whatsappLink(tc("whatsappPreset")).replace(/wa\.me\/\d+/, `wa.me/${contacts.whatsapp}`);

  return (
    <section className="section-y">
      <div className="container-site max-w-2xl text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" />
        <h1 className="mt-4">{t("title")}</h1>
        <p className="mt-4 text-lg text-ink-muted">{t(`byType.${type}`)}</p>
        <p className="mt-6 text-sm text-ink-muted">{t("fast")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={wa} external variant="whatsapp" size="lg">
            <MessageCircle className="size-5" aria-hidden="true" />
            {t("whatsapp")}
          </ButtonLink>
          <ButtonLink href="/objects" variant="secondary" size="lg">
            {t("objects")}
          </ButtonLink>
        </div>
      </div>
      <LeadSubmitEvent leadType={type} />
    </section>
  );
}
