import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FillIn } from "@/components/ui/Placeholder";
import { formatPhoneDisplay } from "@/lib/format";
import type { Contacts } from "@/lib/settings";
import { instagramLink, isPlaceholder, phoneHref, site, telegramLink, whatsappLink } from "@/site.config";

export async function Footer({ contacts }: { contacts: Contacts }) {
  const t = await getTranslations("common");
  const year = new Date().getFullYear();
  const nav = [
    { href: "/objects", label: t("nav.objects") },
    { href: "/cases", label: t("nav.cases") },
    { href: "/about", label: t("nav.about") },
    { href: "/owners", label: t("nav.owners") },
    { href: "/search", label: t("nav.search") },
    { href: "/contacts", label: t("nav.contacts") },
  ];
  const linkClass = "hover:text-ink hover:underline underline-offset-4 rounded-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <footer className="border-t border-line bg-surface-2">
      <div className="container-site grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr] lg:py-16">
        <div>
          <p className="text-lg font-semibold">{site.agent.fullName.includes("[") ? site.agent.shortName : site.agent.fullName}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {t("brandRole")} · {site.agent.city}
          </p>
          <p className="mt-3 max-w-sm text-sm text-ink-muted">{site.agent.tagline}</p>
        </div>

        <nav aria-label={t("footer.navTitle")}>
          <p className="mb-3 text-sm font-semibold">{t("footer.navTitle")}</p>
          <ul className="space-y-2 text-sm text-ink-muted">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacy" className={linkClass}>
                {t("nav.privacy")}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer.contactsTitle")}</p>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>
              <a href={phoneHref(contacts.phone)} className={`${linkClass} tabular`}>
                {formatPhoneDisplay(contacts.phone)}
              </a>
            </li>
            <li>
              <a href={whatsappLink().replace(/wa\.me\/\d+/, `wa.me/${contacts.whatsapp}`)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {t("actions.whatsapp")}
              </a>
            </li>
            <li>
              {isPlaceholder(contacts.telegram) ? (
                <span>
                  {t("actions.telegram")}: <FillIn value={contacts.telegram} />
                </span>
              ) : (
                <a href={telegramLink(contacts.telegram)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {t("actions.telegram")}
                </a>
              )}
            </li>
            <li>
              <a href={instagramLink(contacts.instagram)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {t("footer.instagramNote", { handle: contacts.instagram })}
              </a>
            </li>
            <li>
              {isPlaceholder(contacts.email) ? (
                <span>
                  {t("actions.email")}: <FillIn value={contacts.email} />
                </span>
              ) : (
                <a href={`mailto:${contacts.email}`} className={linkClass}>
                  {contacts.email}
                </a>
              )}
            </li>
          </ul>
          <p className="mt-6 mb-1 text-sm font-semibold">{t("footer.legalTitle")}</p>
          <p className="text-sm text-ink-muted">
            <FillIn value={site.legal.entity} />
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-site py-4 text-xs text-ink-muted">
          {t("footer.rights", { year, name: site.agent.fullName.includes("[") ? site.agent.shortName : site.agent.fullName })}
        </div>
      </div>
    </footer>
  );
}
