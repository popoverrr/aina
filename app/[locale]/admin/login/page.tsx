import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminSession } from "@/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { site } from "@/site.config";

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (session) redirect("/admin/objects");

  const [t, sp] = await Promise.all([getTranslations("admin"), searchParams]);
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-base border border-line bg-surface p-6 shadow-card sm:p-8">
        <p className="text-sm text-ink-muted">{site.agent.shortName}</p>
        <h1 className="mt-1 text-2xl">{t("login.title")}</h1>
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
