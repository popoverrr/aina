"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { FormConsent, HoneypotField } from "@/components/forms/FormConsent";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { useLeadSubmit } from "@/components/forms/useLeadSubmit";
import { formatPhoneInput } from "@/lib/phone-mask";
import { contactLeadSchema, type ContactLeadInput, type ContactLeadValues } from "@/lib/validation/lead";

export interface LeadFormProps {
  type?: "CONTACT" | "OBJECT" | "PRESENTATION";
  propertyId?: string;
  submitLabel?: string;
  note?: string;
  /** текст согласия со ссылкой, собранный на сервере (ConsentText) */
  consent: ReactNode;
  /** компактная раскладка: имя и телефон в одну строку на десктопе */
  compact?: boolean;
  idPrefix?: string;
  /** значения, введённые в статичную копию формы до гидрации */
  initialValues?: Record<string, string>;
  /** поле, которое было в фокусе до гидрации — вернуть фокус после монтирования */
  autoFocusField?: string;
}

/** Компактная форма: имя, телефон, комментарий (необязательно). */
export function LeadForm({ type = "CONTACT", propertyId, submitLabel, note, consent, compact = false, idPrefix = "lead", initialValues, autoFocusField }: LeadFormProps) {
  const t = useTranslations("forms");
  const tc = useTranslations("common.actions");
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ContactLeadInput, unknown, ContactLeadValues>({
    resolver: zodResolver(contactLeadSchema),
    mode: "onTouched",
    defaultValues: {
      type,
      propertyId: propertyId ?? "",
      name: initialValues?.name ?? "",
      phone: initialValues?.phone ? formatPhoneInput(initialValues.phone) : "",
      comment: initialValues?.comment ?? "",
      website: "",
      startedAt: 0,
      pagePath: "",
    },
  });
  const { submit, pending, formError, errorText } = useLeadSubmit<ContactLeadInput>(setValue, setError);

  useEffect(() => {
    if (autoFocusField === "name" || autoFocusField === "phone" || autoFocusField === "comment") setFocus(autoFocusField);
  }, [autoFocusField, setFocus]);

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="relative space-y-4">
      <input type="hidden" {...register("type")} />
      <input type="hidden" {...register("propertyId")} />
      <HoneypotField {...register("website")} />

      <div className={compact ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        <Input
          id={`${idPrefix}-name`}
          label={t("labels.name")}
          placeholder={t("labels.namePlaceholder")}
          autoComplete="name"
          required
          requiredLabel={t("requiredMark")}
          error={errorText(errors.name?.message)}
          {...register("name")}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              id={`${idPrefix}-phone`}
              label={t("labels.phone")}
              placeholder={t("labels.phonePlaceholder")}
              required
              requiredLabel={t("requiredMark")}
              error={errorText(errors.phone?.message)}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
      </div>

      <Textarea
        id={`${idPrefix}-comment`}
        label={t("labels.commentOptional")}
        rows={compact ? 3 : 4}
        error={errorText(errors.comment?.message)}
        {...register("comment")}
      />

      {formError ? (
        <p role="alert" className="rounded-base border border-hot/40 bg-hot/5 px-3 py-2 text-sm text-hot">
          {formError}
        </p>
      ) : null}

      <div className="space-y-3">
        <Button type="submit" size="lg" loading={pending} loadingText={tc("sending")} className="w-full sm:w-auto">
          {submitLabel ?? t("labels.submit")}
        </Button>
        <FormConsent note={note} consent={consent} />
      </div>
    </form>
  );
}
