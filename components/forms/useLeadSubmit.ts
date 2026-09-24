"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import type { FieldValues, Path, UseFormSetError, UseFormSetValue } from "react-hook-form";
import { submitLead } from "@/lib/actions/leads";
import type { LeadActionResult } from "@/lib/validation/lead";

/**
 * Общая логика отправки для всех форм: технические поля антиспама, вызов Server Action,
 * разбор ошибок. При успехе Server Action делает redirect на /thanks — промис не резолвится,
 * поэтому pending остаётся включённым до перехода.
 */
export function useLeadSubmit<T extends FieldValues>(setValue: UseFormSetValue<T>, setError: UseFormSetError<T>) {
  const locale = useLocale();
  const tErrors = useTranslations("forms.errors");
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setValue("startedAt" as Path<T>, Date.now() as never, { shouldDirty: false });
    setValue("pagePath" as Path<T>, `${window.location.pathname}${window.location.search}` as never, { shouldDirty: false });
  }, [setValue]);

  const submit = (values: unknown) => {
    setFormError(null);
    startTransition(async () => {
      const result: LeadActionResult | undefined = await submitLead(values, locale);
      if (!result || result.ok) return;
      if (result.fieldErrors) {
        for (const [field, key] of Object.entries(result.fieldErrors)) {
          setError(field as Path<T>, { type: "server", message: key });
        }
      }
      setFormError(result.formError ?? (result.fieldErrors ? null : "generic"));
    });
  };

  const errorText = (key?: string): string | undefined => {
    if (!key) return undefined;
    // ключ словаря или уже готовый текст
    return isErrorKey(key) ? tErrors(key) : key;
  };

  return { submit, pending, formError: formError ? errorText(formError) : null, errorText };
}

const ERROR_KEYS = new Set([
  "nameRequired",
  "nameTooShort",
  "nameTooLong",
  "phoneRequired",
  "phoneInvalid",
  "commentTooLong",
  "spam",
  "generic",
  "rateLimit",
  "dbError",
]);

function isErrorKey(key: string): key is
  | "nameRequired"
  | "nameTooShort"
  | "nameTooLong"
  | "phoneRequired"
  | "phoneInvalid"
  | "commentTooLong"
  | "spam"
  | "generic"
  | "rateLimit"
  | "dbError" {
  return ERROR_KEYS.has(key);
}
