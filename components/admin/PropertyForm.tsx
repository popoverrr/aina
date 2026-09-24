"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { checkSlugAvailable, saveProperty } from "@/lib/actions/admin";
import { DISTRICTS } from "@/lib/districts";
import { slugify } from "@/lib/slug";
import { DEAL_TYPES, PROP_KINDS, PROP_STATUSES } from "@/lib/enums";
import { propertySchema, type PropertyFormInput, type PropertyFormValues } from "@/lib/validation/admin";

export const EMPTY_PROPERTY: PropertyFormInput = {
  title: "",
  slug: "",
  externalId: "",
  kind: "RETAIL",
  dealType: "RENT",
  status: "ACTIVE",
  district: "",
  address: "",
  landmark: "",
  lat: "",
  lng: "",
  areaM2: "",
  ceilingM: "",
  floor: "",
  entrance: "",
  powerKw: "",
  hasWetPoint: false,
  priceSale: "",
  priceRentM2: "",
  priceRentTotal: "",
  utilitiesIncluded: false,
  isExclusive: false,
  isHot: false,
  isFeatured: false,
  descriptionMd: "",
  advantages: "",
  presentationUrl: "",
  publishedAt: "",
};

/** Форма объекта: все поля модели, сгруппированы. Slug из названия, автосохранение черновика. */
export function PropertyForm({ id, initial }: { id: string | null; initial?: PropertyFormInput }) {
  const t = useTranslations("admin");
  const te = useTranslations("enums");
  const errorText = useAdminErrors();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const slugTouched = useRef(Boolean(initial?.slug));

  const form = useForm<PropertyFormInput, unknown, PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    mode: "onTouched",
    defaultValues: initial ?? EMPTY_PROPERTY,
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = form;
  const { hasDraft, restore, clear } = useDraft(`property:${id ?? "new"}`, form as unknown as ReturnType<typeof useForm<FieldValues>>);

  // slug из названия транслитерацией, пока пользователь не правил его вручную
  const title = useWatch({ control, name: "title" });
  useEffect(() => {
    if (!slugTouched.current) setValue("slug", slugify(title ?? ""), { shouldValidate: false });
  }, [title, setValue]);

  const check = useCallback((slug: string) => checkSlugAvailable(slug, id ?? undefined), [id]);

  const onSubmit = (values: PropertyFormValues) => {
    setNotice(null);
    startTransition(async () => {
      const result = await saveProperty(id, values);
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, key] of Object.entries(result.fieldErrors)) setError(field as keyof PropertyFormInput, { type: "server", message: key });
        }
        setNotice({ tone: "error", text: errorText(result.formError ?? "unknown") ?? "" });
        return;
      }
      clear();
      if (!id) {
        router.push(`/admin/objects/${result.data.id}`);
        return;
      }
      setNotice({ tone: "success", text: t("common.saved") });
      router.refresh();
    });
  };

  const f = (key: keyof PropertyFormInput) => errorText(errors[key]?.message as string | undefined);
  const group = "grid gap-4 sm:grid-cols-2";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
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

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">{t("objects.groups.main")}</legend>
        <Input label={t("objects.fields.title")} required error={f("title")} {...register("title")} />
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
        <div className={group}>
          <Select label={t("objects.fields.kind")} options={PROP_KINDS.map((k) => ({ value: k, label: te(`kind.${k}`) }))} {...register("kind")} />
          <Select label={t("objects.fields.dealType")} options={DEAL_TYPES.map((d) => ({ value: d, label: te(`deal.${d}`) }))} {...register("dealType")} />
          <Select label={t("objects.fields.status")} options={PROP_STATUSES.map((s) => ({ value: s, label: te(`status.${s}`) }))} {...register("status")} />
          <Input label={t("objects.fields.externalId")} {...register("externalId")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">{t("objects.groups.location")}</legend>
        <div className={group}>
          <Select label={t("objects.fields.district")} options={DISTRICTS.map((d) => ({ value: d.name, label: d.name }))} placeholder="—" required error={f("district")} {...register("district")} />
          <Input label={t("objects.fields.landmark")} {...register("landmark")} />
          <Input label={t("objects.fields.address")} wrapperClassName="sm:col-span-2" {...register("address")} />
          <Input label={t("objects.fields.lat")} inputMode="decimal" error={f("lat")} {...register("lat")} />
          <Input label={t("objects.fields.lng")} inputMode="decimal" error={f("lng")} {...register("lng")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">{t("objects.groups.params")}</legend>
        <div className={group}>
          <Input label={t("objects.fields.areaM2")} inputMode="decimal" required error={f("areaM2")} {...register("areaM2")} />
          <Input label={t("objects.fields.ceilingM")} inputMode="decimal" error={f("ceilingM")} {...register("ceilingM")} />
          <Input label={t("objects.fields.floor")} {...register("floor")} />
          <Input label={t("objects.fields.entrance")} {...register("entrance")} />
          <Input label={t("objects.fields.powerKw")} inputMode="decimal" error={f("powerKw")} {...register("powerKw")} />
          <Checkbox label={t("objects.fields.hasWetPoint")} wrapperClassName="self-end pb-3" {...register("hasWetPoint")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">{t("objects.groups.price")}</legend>
        <div className={group}>
          <Input label={t("objects.fields.priceSale")} inputMode="numeric" error={f("priceSale")} {...register("priceSale")} />
          <Input label={t("objects.fields.priceRentTotal")} inputMode="numeric" error={f("priceRentTotal")} {...register("priceRentTotal")} />
          <Input label={t("objects.fields.priceRentM2")} inputMode="numeric" error={f("priceRentM2")} {...register("priceRentM2")} />
          <Checkbox label={t("objects.fields.utilitiesIncluded")} wrapperClassName="self-end pb-3" {...register("utilitiesIncluded")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">{t("objects.groups.texts")}</legend>
        <Textarea label={t("objects.fields.descriptionMd")} rows={8} {...register("descriptionMd")} />
        <Textarea label={t("objects.fields.advantages")} rows={4} {...register("advantages")} />
        <Input label={t("objects.fields.presentationUrl")} type="url" error={f("presentationUrl")} {...register("presentationUrl")} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">{t("objects.groups.flags")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox label={t("objects.fields.isHot")} {...register("isHot")} />
          <Checkbox label={t("objects.fields.isFeatured")} {...register("isFeatured")} />
          <Checkbox label={t("objects.fields.isExclusive")} {...register("isExclusive")} />
          <Input label={t("objects.fields.publishedAt")} type="date" error={f("publishedAt")} {...register("publishedAt")} />
        </div>
      </fieldset>

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={pending} loadingText={t("common.saving")}>
          {id ? t("common.save") : t("common.create")}
        </Button>
      </div>
    </form>
  );
}
