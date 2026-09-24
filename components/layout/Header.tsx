import Image from "next/image";
import { MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { formatPhoneDisplay } from "@/lib/format";
import type { Contacts } from "@/lib/settings";
import { phoneHref, site, whatsappLink } from "@/site.config";

export async function Header({ contacts }: { contacts: Contacts }) {
  const t = await getTranslations("common");
  const items = [
    { href: "/objects", label: t("nav.objects") },
    { href: "/cases", label: t("nav.cases") },
    { href: "/about", label: t("nav.about") },
    { href: "/owners", label: t("nav.owners") },
    { href: "/contacts", label: t("nav.contacts") },
  ];
  const phone = formatPhoneDisplay(contacts.phone);
  const wa = whatsappLink(t("whatsappPreset")).replace(/wa\.me\/\d+/, `wa.me/${contacts.whatsapp}`);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 rounded-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <Image
            src="/agent/avatar-160.jpg"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
            priority={false}
          />
          <span className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight">{site.agent.shortName}</span>
            <span className="text-xs text-ink-muted">{t("brandRole")}</span>
          </span>
        </Link>

        <nav className="hidden md:block" aria-label={t("nav.home")}>
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-base px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a href={phoneHref(contacts.phone)} className={buttonClasses("ghost", "sm", "tabular")}>
            <Phone className="size-4" aria-hidden="true" />
            {phone}
          </a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClasses("whatsapp", "sm")}>
            <MessageCircle className="size-4" aria-hidden="true" />
            {t("actions.whatsapp")}
          </a>
        </div>

        <MobileMenu
          items={[{ href: "/", label: t("nav.home") }, ...items, { href: "/search", label: t("nav.search") }]}
          phone={phone}
          phoneHref={phoneHref(contacts.phone)}
          whatsappHref={wa}
          labels={{
            open: t("actions.menu"),
            close: t("actions.closeMenu"),
            call: t("actions.call"),
            whatsapp: t("actions.whatsappWrite"),
            brand: site.agent.shortName,
            role: t("brandRole"),
          }}
        />
      </div>
    </header>
  );
}
