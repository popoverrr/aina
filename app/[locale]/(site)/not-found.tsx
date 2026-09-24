import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <section className="section-y">
      <div className="container-site max-w-2xl text-center">
        <p className="text-sm font-medium text-ink-muted">404</p>
        <h1 className="mt-2">{t("notFound.title")}</h1>
        <p className="mt-4 text-ink-muted">{t("notFound.text")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/objects">{t("notFound.cta")}</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            {t("actions.toHome")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
