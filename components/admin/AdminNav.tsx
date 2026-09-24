import { Briefcase, Building2, ExternalLink, Inbox, LogOut, Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { logoutAction } from "@/lib/actions/admin";
import { site } from "@/site.config";

export async function AdminNav({ email, newLeads }: { email: string; newLeads: number }) {
  const t = await getTranslations("admin");
  const items = [
    { href: "/admin/objects", label: t("nav.objects"), Icon: Building2 },
    { href: "/admin/cases", label: t("nav.cases"), Icon: Briefcase },
    { href: "/admin/leads", label: t("nav.leads"), Icon: Inbox, badge: newLeads },
    { href: "/admin/settings", label: t("nav.settings"), Icon: Settings },
  ];
  const linkClass =
    "flex items-center gap-3 rounded-base px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <aside className="border-b border-line bg-surface lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-5">
        <div>
          <p className="font-semibold">{site.agent.shortName}</p>
          <p className="text-xs text-ink-muted">{t("title")}</p>
        </div>
        <p className="hidden text-xs text-ink-muted lg:mt-1 lg:block">{email}</p>
      </div>
      <nav aria-label={t("title")} className="px-2 pb-2 lg:px-3">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {items.map(({ href, label, Icon, badge }) => (
            <li key={href} className="shrink-0">
              <Link href={href} className={linkClass}>
                <Icon className="size-4" aria-hidden="true" />
                <span>{label}</span>
                {badge ? <span className="ml-auto rounded-full bg-hot px-2 py-0.5 text-xs text-white tabular">{badge}</span> : null}
              </Link>
            </li>
          ))}
          <li className="shrink-0">
            <Link href="/" className={linkClass}>
              <ExternalLink className="size-4" aria-hidden="true" />
              <span>{t("nav.site")}</span>
            </Link>
          </li>
          <li className="shrink-0">
            <form action={logoutAction}>
              <button type="submit" className={`${linkClass} w-full text-left`}>
                <LogOut className="size-4" aria-hidden="true" />
                <span>{t("nav.logout")}</span>
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
