import type { Metadata } from "next";
import { AtSign, Camera, MessageCircle, Phone, Send } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LeadFormDeferred } from "@/components/forms/LeadFormStatic";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillIn } from "@/components/ui/Placeholder";
import { formatPhoneDisplay } from "@/lib/format";
import { getContacts } from "@/lib/settings";
import { instagramLink, isPlaceholder, phoneHref, site, telegramLink, whatsappLink } from "@/site.config";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contacts.meta");
  const name = site.agent.fullName.includes("[") ? site.agent.shortName : site.agent.fullName;
  return { title: t("title"), description: t("description", { name }), alternates: { canonical: "/contacts" } };
}

export default async function ContactsPage() {
  const [t, tc, contacts] = await Promise.all([getTranslations("contacts"), getTranslations("common"), getContacts()]);
  const wa = whatsappLink(tc("whatsappPreset")).replace(/wa\.me\/\d+/, `wa.me/${contacts.whatsapp}`);
  const rowClass = "flex items-center gap-4 rounded-base border border-line bg-surface p-4 transition-[border-color] hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  const rows: Array<{ key: string; label: string; value: React.ReactNode; href?: string; Icon: typeof Phone; external?: boolean }> = [
    { key: "phone", label: t("phone"), value: formatPhoneDisplay(contacts.phone), href: phoneHref(contacts.phone), Icon: Phone },
    { key: "whatsapp", label: t("whatsapp"), value: formatPhoneDisplay(`+${contacts.whatsapp}`), href: wa, Icon: MessageCircle, external: true },
    {
      key: "telegram",
      label: t("telegram"),
      value: isPlaceholder(contacts.telegram) ? <FillIn value={contacts.telegram} /> : `@${contacts.telegram.replace(/^@/, "")}`,
      href: isPlaceholder(contacts.telegram) ? undefined : telegramLink(contacts.telegram),
      Icon: Send,
      external: true,
    },
    { key: "instagram", label: t("instagram"), value: `@${contacts.instagram}`, href: instagramLink(contacts.instagram), Icon: Camera, external: true },
    {
      key: "email",
      label: t("email"),
      value: isPlaceholder(contacts.email) ? <FillIn value={contacts.email} /> : contacts.email,
      href: isPlaceholder(contacts.email) ? undefined : `mailto:${contacts.email}`,
      Icon: AtSign,
    },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: tc("nav.contacts") }]} />
      <section className="section-y pt-6 lg:pt-8">
        <div className="container-site grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1>{t("title")}</h1>
            <p className="mt-3 text-ink-muted">{t("intro")}</p>
            <ul className="mt-8 space-y-3">
              {rows.map(({ key, label, value, href, Icon, external }) => {
                const inner = (
                  <>
                    <Icon className="size-5 shrink-0 text-accent" aria-hidden="true" />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs text-ink-muted">{label}</span>
                      <span className="truncate font-medium tabular">{value}</span>
                    </span>
                  </>
                );
                return (
                  <li key={key}>
                    {href ? (
                      <a href={href} className={rowClass} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {inner}
                      </a>
                    ) : (
                      <div className={rowClass}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            <dl className="mt-8 space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-muted">{t("city")}</dt>
                <dd>{site.agent.city}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-muted">{t("legal")}</dt>
                <dd>
                  <FillIn value={site.legal.entity} />
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-base border border-line bg-surface-2 p-6 lg:p-8">
            <h2 className="text-xl">{t("form.title")}</h2>
            <p className="mt-2 mb-6 text-sm text-ink-muted">{t("form.text")}</p>
            <LeadFormDeferred type="CONTACT" note={t("form.note")} idPrefix="contacts" />
          </div>
        </div>
      </section>
    </>
  );
}
