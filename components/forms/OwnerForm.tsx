"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { FormConsent, HoneypotField } from "@/components/forms/FormConsent";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { useLeadSubmit } from "@/components/forms/useLeadSubmit";
import { DISTRICTS } from "@/lib/districts";
import { PROP_KINDS } from "@/lib/enums";
import { ownerLeadSchema, type OwnerLeadInput, type OwnerLeadValues } from "@/lib/validation/lead";

/** Форма «Оценить объект»: имя, телефон, тип объекта, район, площадь. */
export function OwnerForm({ submitLabel, note, consent }: { submitLabel: string; note?: string; consent: ReactNode }) {
  const tf = useTranslations("forms");
  const te = useTranslations("enums");
  const tc = useTranslations("common.actions");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<OwnerLeadInput, unknown, OwnerLeadValues>({
    resolver: zodResolver(ownerLeadSchema),
    mode: "onTouched",
    defaultValues: { type: "OWNER", name: "", phone: "", briefKind: "", district: "", briefAreaFrom: "", comment: "", website: "", startedAt: 0, pagePath: "" },
  });
  const { submit, pending, formError, errorText } = useLeadSubmit<OwnerLeadInput>(setValue, setError);

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="relative space-y-4">
      <input type="hidden" {...register("type")} />
      <HoneypotField {...register("website")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={tf("labels.name")}
          placeholder={tf("labels.namePlaceholder")}
          autoComplete="name"
          required
          requiredLabel={tf("requiredMark")}
          error={errorText(errors.name?.message)}
          {...register("name")}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              label={tf("labels.phone")}
              placeholder={tf("labels.phonePlaceholder")}
              required
              requiredLabel={tf("requiredMark")}
              error={errorText(errors.phone?.message)}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
        <Select label={tf("labels.kind")} options={PROP_KINDS.map((k) => ({ value: k, label: te(`kind.${k}`) }))} placeholder={tf("labels.kindAny")} {...register("briefKind")} />
        <Select label={tf("labels.district")} options={DISTRICTS.map((d) => ({ value: d.slug, label: d.name }))} placeholder={tf("labels.districtAny")} {...register("district")} />
        <Input label={tf("labels.area")} type="number" inputMode="decimal" min={0} {...register("briefAreaFrom")} />
      </div>
      <Textarea label={tf("labels.commentOptional")} rows={3} error={errorText(errors.comment?.message)} {...register("comment")} />

      {formError ? (
        <p role="alert" className="rounded-base border border-hot/40 bg-hot/5 px-3 py-2 text-sm text-hot">
          {formError}
        </p>
      ) : null}

      <div className="space-y-3">
        <Button type="submit" size="lg" loading={pending} loadingText={tc("sending")} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
        <FormConsent note={note} consent={consent} />
      </div>
    </form>
  );
}
