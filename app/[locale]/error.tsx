"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="section-y">
      <div className="container-site max-w-2xl text-center">
        <p className="text-sm font-medium text-ink-muted">500</p>
        <h1 className="mt-2">{t("error.title")}</h1>
        <p className="mt-4 text-ink-muted">{t("error.text")}</p>
        <div className="mt-8">
          <Button onClick={reset}>{t("error.retry")}</Button>
        </div>
      </div>
    </section>
  );
}
