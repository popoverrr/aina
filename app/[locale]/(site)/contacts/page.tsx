import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AtSign, Camera, MessageCircle, Phone, Send } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LeadFormDeferred } from "@/components/forms/LeadFormStatic";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { formatPhoneDisplay } from "@/lib/format";
import { getContacts } from "@/lib/settings";
import { instagramLink, isFilled, phoneHref, site, telegramHandle, telegramLink, whatsappLink } from "@/site.config";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contacts.meta");
  return { title: t("title"), description: t("description", { name: site.agent.fullName }), alternates: { canonical: "/contacts" } };
}

interface ContactRow {
  key: string;
  label: string;
  value: ReactNode;
  href?: string;
  Icon: typeof Phone;
  external?: boolean;
}

export default async function ContactsPage() {
  const [t, tc, contacts] = await Promise.all([getTranslations("contacts"), getTranslations("common"), getContacts()]);
  const wa = whatsappLink(tc("whatsappPreset")).replace(/wa\.me\/\d+/, `wa.me/${contacts.whatsapp}`);
  const rowClass = "flex items-center gap-4 rounded-base border border-line bg-surface p-4 transition-[border-color] hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  // Telegram-приглашение сделано по номеру, публичного username нет: показываем номер,
  // как в строке WhatsApp. Если в настройках укажут username — покажем @username.
  const tgHandle = isFilled(contacts.telegram) ? telegramHandle(contacts.telegram) : null;

  const rows: ContactRow[] = [
    { key: "phone", label: t("phone"), value: formatPhoneDisplay(contacts.phone), href: phoneHref(contacts.phone), Icon: Phone },
    { key: "whatsapp", label: t("whatsapp"), value: formatPhoneDisplay(`+${contacts.whatsapp}`), href: wa, Icon: MessageCircle, external: true },
  ];

  if (isFilled(contacts.telegram)) {
    rows.push({
      key: "telegram",
      label: t("telegram"),
      value: tgHandle ? `@${tgHandle}` : formatPhoneDisplay(contacts.phone),
      href: telegramLink(contacts.telegram),
      Icon: Send,
      external: true,
    });
  }

  rows.push({ key: "instagram", label: t("instagram"), value: `@${contacts.instagram}`, href: instagramLink(contacts.instagram), Icon: Camera, external: true });

  // Email показываем, только если он задан: пустую строку и заглушку не рендерим.
  if (isFilled(contacts.email)) {
    rows.push({ key: "email", label: t("email"), value: contacts.email, href: `mailto:${contacts.email}`, Icon: AtSign });
  }

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
              {isFilled(site.legal.entity) ? (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-ink-muted">{t("legal")}</dt>
                  <dd>{site.legal.entity}</dd>
                </div>
              ) : null}
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
