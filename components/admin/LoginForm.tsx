"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { loginAction, type LoginState } from "@/lib/actions/admin";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("admin.login");
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Input id="login-email" name="email" type="email" label={t("email")} autoComplete="username" required />
      <Input id="login-password" name="password" type="password" label={t("password")} autoComplete="current-password" required />
      {state.error ? (
        <p role="alert" className="rounded-base border border-hot/40 bg-hot/5 px-3 py-2 text-sm text-hot">
          {state.error === "notConfigured" ? t("notConfigured") : t("error")}
        </p>
      ) : null}
      <Button type="submit" size="lg" loading={pending} className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
