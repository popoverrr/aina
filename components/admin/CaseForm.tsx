"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm, useWatch, type FieldValues } from "react-hook-form";
import { useRouter } from "@/i18n/navigation";
import { Notice } from "@/components/admin/ui";
import { SlugField } from "@/components/admin/SlugField";
import { useAdminErrors } from "@/components/admin/useAdminErrors";
import { useDraft } from "@/components/admin/useDraft";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { checkCaseSlugAvailable, removeCaseCover, saveCase, uploadCaseCover } from "@/lib/actions/admin";
import { DISTRICTS } from "@/lib/districts";
import { slugify } from "@/lib/slug";
import { DEAL_TYPES, PROP_KINDS } from "@/lib/enums";
import { caseSchema, type CaseFormInput, type CaseFormValues } from "@/lib/validation/admin";

export const EMPTY_CASE: CaseFormInput = {
  title: "",
  slug: "",
  kind: "RETAIL",
  dealType: "RENT",
  district: "",
  areaM2: "",
  amountLabel: "",
  durationLabel: "",
  task: "",
  solution: "",
  result: "",
  isFeatured: false,
  order: "0",
};

export function CaseForm({ id, initial, coverUrl, storageReady }: { id: string | null; initial?: CaseFormInput; coverUrl?: string | null; storageReady: boolean }) {
  const t = useTranslations("admin");
  const te = useTranslations("enums");
  const errorText = useAdminErrors();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [cover, setCover] = useState<string | null>(coverUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(Boolean(initial?.slug));

  const form = useForm<CaseFormInput, unknown, CaseFormValues>({ resolver: zodResolver(caseSchema), mode: "onTouched", defaultValues: initial ?? EMPTY_CASE });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = form;
  const { hasDraft, restore, clear } = useDraft(`case:${id ?? "new"}`, form as unknown as ReturnType<typeof useForm<FieldValues>>);

  const title = useWatch({ control, name: "title" });
  useEffect(() => {
    if (!slugTouched.current) setValue("slug", slugify(title ?? ""));
  }, [title, setValue]);

  const check = useCallback((slug: string) => checkCaseSlugAvailable(slug, id ?? undefined), [id]);

  const onSubmit = (values: CaseFormValues) => {
    setNotice(null);
    startTransition(async () => {
      const result = await saveCase(id, values);
      if (!result.ok) {
        if (result.fieldErrors) for (const [field, key] of Object.entries(result.fieldErrors)) setError(field as keyof CaseFormInput, { type: "server", message: key });
        setNotice({ tone: "error", text: errorText(result.formError ?? "unknown") ?? "" });
        return;
      }
      clear();
      if (!id) {
        router.push(`/admin/cases/${result.data.id}`);
        return;
      }
      setNotice({ tone: "success", text: t("common.saved") });
      router.refresh();
    });
  };

  const uploadCover = (file: File) => {
    if (!id) return;
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const result = await uploadCaseCover(id, fd);
      if (!result.ok) {
        setNotice({ tone: "error", text: errorText(result.formError ?? "unknown") ?? "" });
        return;
      }
      setCover(result.data.url);
    });
  };

  const f = (key: keyof CaseFormInput) => errorText(errors[key]?.message as string | undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {hasDraft ? (
        <div className="flex flex-wrap items-center gap-3 rounded-base border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
          <span>{t("common.restoreDraft")}</span>
          <Button size="sm" variant="secondary" onClick={restore}>
            {t("common.restore")}
          </Button>
          <Button size="sm" variant="ghost" onClick={clear}>
            {t("common.discard")}
          </Button>
        </div>
      ) : null}

      <Input label={t("cases.fields.title")} required error={f("title")} {...register("title")} />
      <Controller
        control={control}
        name="slug"
        render={({ field }) => (
          <SlugField
            name={field.name}
            value={field.value ?? ""}
            onChange={(v) => {
              slugTouched.current = true;
              field.onChange(v);
            }}
            onBlur={field.onBlur}
            error={f("slug")}
            check={check}
          />
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={t("cases.fields.kind")} options={PROP_KINDS.map((k) => ({ value: k, label: te(`kind.${k}`) }))} {...register("kind")} />
        <Select label={t("cases.fields.dealType")} options={DEAL_TYPES.map((d) => ({ value: d, label: te(`deal.${d}`) }))} {...register("dealType")} />
        <Select label={t("cases.fields.district")} options={DISTRICTS.map((d) => ({ value: d.name, label: d.name }))} placeholder="—" {...register("district")} />
        <Input label={t("cases.fields.areaM2")} inputMode="decimal" error={f("areaM2")} {...register("areaM2")} />
        <Input label={t("cases.fields.amountLabel")} {...register("amountLabel")} />
        <Input label={t("cases.fields.durationLabel")} {...register("durationLabel")} />
      </div>
      <Textarea label={t("cases.fields.task")} rows={4} required error={f("task")} {...register("task")} />
      <Textarea label={t("cases.fields.solution")} rows={4} required error={f("solution")} {...register("solution")} />
      <Textarea label={t("cases.fields.result")} rows={4} required error={f("result")} {...register("result")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("cases.fields.order")} inputMode="numeric" error={f("order")} {...register("order")} />
        <Checkbox label={t("cases.fields.isFeatured")} wrapperClassName="self-end pb-3" {...register("isFeatured")} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{t("cases.fields.cover")}</legend>
        {!id ? (
          <Notice>{t("objects.photos.saveFirst")}</Notice>
        ) : (
          <>
            {!storageReady ? <Notice tone="error">{t("objects.photos.notConfigured")}</Notice> : null}
            {cover ? (
              <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-base bg-surface-2">
                <Image src={cover} alt="" fill sizes="448px" className="object-cover" />
              </div>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadCover(file);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" disabled={!storageReady} loading={pending} onClick={() => fileRef.current?.click()}>
                {cover ? t("cases.cover.replace") : t("cases.cover.upload")}
              </Button>
              {cover ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await removeCaseCover(id);
                      if (result.ok) setCover(null);
                    })
                  }
                >
                  {t("cases.cover.remove")}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </fieldset>

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <Button type="submit" size="lg" loading={pending} loadingText={t("common.saving")}>
        {id ? t("common.save") : t("common.create")}
      </Button>
    </form>
  );
}
