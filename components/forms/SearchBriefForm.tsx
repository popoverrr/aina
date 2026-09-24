"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { FormConsent, HoneypotField } from "@/components/forms/FormConsent";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { useLeadSubmit } from "@/components/forms/useLeadSubmit";
import { cn } from "@/lib/cn";
import { DISTRICTS } from "@/lib/districts";
import { PROP_KINDS } from "@/lib/enums";
import { normalizePhone } from "@/lib/format";
import { searchBriefSchema, type SearchBriefInput, type SearchBriefValues } from "@/lib/validation/lead";

const TOTAL_STEPS = 4;

/**
 * Бриф-форма в 4 шага на одном экране: шаги — визуальные секции с прогресс-индикатором.
 * Кнопка активна только при валидных обязательных полях (имя и телефон).
 */
export function SearchBriefForm({ consent }: { consent: ReactNode }) {
  const t = useTranslations("search");
  const tf = useTranslations("forms");
  const te = useTranslations("enums");
  const tc = useTranslations("common.actions");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isValid },
  } = useForm<SearchBriefInput, unknown, SearchBriefValues>({
    resolver: zodResolver(searchBriefSchema),
    mode: "onTouched",
    defaultValues: {
      type: "SEARCH",
      briefKind: "",
      dealType: "",
      briefAreaFrom: "",
      briefAreaTo: "",
      briefBudget: "",
      briefDistricts: [],
      briefBusiness: "",
      name: "",
      phone: "",
      website: "",
      startedAt: 0,
      pagePath: "",
    },
  });
  const { submit, pending, formError, errorText } = useLeadSubmit<SearchBriefInput>(setValue, setError);

  const values = useWatch({ control });
  const districts = Array.isArray(values.briefDistricts) ? values.briefDistricts : [];
  const stepDone = [
    Boolean(values.briefKind || values.dealType),
    Boolean(values.briefAreaFrom || values.briefAreaTo || values.briefBudget || districts.length > 0),
    Boolean(values.briefBusiness),
    Boolean(values.name && values.name.trim().length >= 2 && values.phone && normalizePhone(values.phone)),
  ];
  const done = stepDone.filter(Boolean).length;

  const kindOptions = PROP_KINDS.map((k) => ({ value: k, label: te(`kind.${k}`) }));

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="relative space-y-10">
      <input type="hidden" {...register("type")} />
      <HoneypotField {...register("website")} />

      {/* Прогресс */}
      <div aria-live="polite">
        <p className="mb-2 text-sm text-ink-muted">{t("progress", { done, total: TOTAL_STEPS })}</p>
        <ol className="grid grid-cols-4 gap-2" aria-hidden="true">
          {stepDone.map((isDone, i) => (
            <li key={i} className={cn("h-1.5 rounded-base transition-colors", isDone ? "bg-accent" : "bg-line")} />
          ))}
        </ol>
      </div>

      <StepSection n={1} title={t("steps.1.title")} text={t("steps.1.text")} done={stepDone[0] ?? false}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={tf("labels.kind")} options={kindOptions} placeholder={tf("labels.kindAny")} {...register("briefKind")} />
          <Select
            label={tf("labels.deal")}
            options={[
              { value: "RENT", label: tf("labels.rent") },
              { value: "SALE", label: tf("labels.sale") },
            ]}
            placeholder={tf("labels.kindAny")}
            {...register("dealType")}
          />
        </div>
      </StepSection>

      <StepSection n={2} title={t("steps.2.title")} text={t("steps.2.text")} done={stepDone[1] ?? false}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label={tf("labels.areaFrom")} type="number" inputMode="decimal" min={0} {...register("briefAreaFrom")} />
          <Input label={tf("labels.areaTo")} type="number" inputMode="decimal" min={0} {...register("briefAreaTo")} />
          <Input label={tf("labels.budget")} placeholder={tf("labels.budgetPlaceholder")} {...register("briefBudget")} />
        </div>
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium">{tf("labels.districts")}</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DISTRICTS.map((d) => (
              <Checkbox key={d.slug} value={d.slug} label={d.name} {...register("briefDistricts")} />
            ))}
          </div>
        </fieldset>
      </StepSection>

      <StepSection n={3} title={t("steps.3.title")} text={t("steps.3.text")} done={stepDone[2] ?? false}>
        <Textarea label={tf("labels.business")} placeholder={tf("labels.businessPlaceholder")} rows={4} {...register("briefBusiness")} />
      </StepSection>

      <StepSection n={4} title={t("steps.4.title")} text={t("steps.4.text")} done={stepDone[3] ?? false}>
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
        </div>
      </StepSection>

      {formError ? (
        <p role="alert" className="rounded-base border border-hot/40 bg-hot/5 px-3 py-2 text-sm text-hot">
          {formError}
        </p>
      ) : null}

      <div className="space-y-3">
        <Button type="submit" size="lg" disabled={!isValid} loading={pending} loadingText={tc("sending")} className="w-full sm:w-auto">
          {t("submit")}
        </Button>
        <FormConsent note={t("note")} consent={consent} />
      </div>
    </form>
  );
}

function StepSection({ n, title, text, done, children }: { n: number; title: string; text: string; done: boolean; children: ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`} className="grid gap-4 md:grid-cols-[200px_1fr] md:gap-8">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
            done ? "border-accent bg-accent text-white" : "border-line text-ink-muted",
          )}
          aria-hidden="true"
        >
          {done ? <Check className="size-4" /> : n}
        </span>
        <div>
          <h2 id={`step-${n}`} className="text-lg font-semibold">
            {title}
          </h2>
          <p className="text-sm text-ink-muted">{text}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}
