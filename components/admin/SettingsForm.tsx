"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/i18n/navigation";
import { Notice } from "@/components/admin/ui";
import { useAdminErrors } from "@/components/admin/useAdminErrors";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { saveSettings } from "@/lib/actions/admin";
import { settingsSchema, type SettingsFormInput, type SettingsFormValues } from "@/lib/validation/admin";

export function SettingsForm({ initial }: { initial: SettingsFormInput }) {
  const t = useTranslations("admin.settings");
  const tc = useTranslations("admin.common");
  const errorText = useAdminErrors();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });

  const onSubmit = (values: SettingsFormValues) => {
    setNotice(null);
    startTransition(async () => {
      const result = await saveSettings(values);
      if (!result.ok) {
        setNotice({ tone: "error", text: errorText(result.formError ?? "unknown") ?? "" });
        return;
      }
      setNotice({ tone: "success", text: t("saved") });
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-lg font-semibold">{t("hero.title")}</legend>
        <p className="text-xs text-ink-muted">{t("hero.hint")}</p>
        <Input label={t("hero.heroTitle")} {...register("hero.title")} />
        <Textarea label={t("hero.heroSubtitle")} rows={3} {...register("hero.subtitle")} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-lg font-semibold">{t("stats.title")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t("stats.years")} {...register("stats.years")} />
          <Input label={t("stats.volume")} {...register("stats.volume")} />
          <Input label={t("stats.objects")} {...register("stats.objects")} />
          <Input label={t("stats.avgDeal")} {...register("stats.avgDeal")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-lg font-semibold">{t("contacts.title")}</legend>
        <p className="text-xs text-ink-muted">{t("contacts.hint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t("contacts.phone")} {...register("contacts.phone")} />
          <Input label={t("contacts.whatsapp")} {...register("contacts.whatsapp")} />
          <Input label={t("contacts.telegram")} {...register("contacts.telegram")} />
          <Input label={t("contacts.instagram")} {...register("contacts.instagram")} />
          <Input label={t("contacts.email")} type="email" {...register("contacts.email")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-lg font-semibold">{t("golden.title")}</legend>
        <Textarea label={t("golden.text")} rows={6} {...register("golden.text")} />
      </fieldset>

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <Button type="submit" size="lg" loading={pending} loadingText={tc("saving")}>
        {tc("save")}
      </Button>
    </form>
  );
}
