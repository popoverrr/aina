"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Field";
import { isValidSlug } from "@/lib/slug";

interface SlugFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  check: (slug: string) => Promise<boolean>;
  name: string;
}

/** Поле slug с проверкой уникальности через Server Action (с задержкой). */
export function SlugField({ value, onChange, onBlur, error, check, name }: SlugFieldProps) {
  const t = useTranslations("admin.objects.fields");
  // результат последней проверки: для какого slug и свободен ли он
  const [checked, setChecked] = useState<{ slug: string; free: boolean } | null>(null);

  useEffect(() => {
    if (!value || !isValidSlug(value)) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      check(value)
        .then((free) => {
          if (!cancelled) setChecked({ slug: value, free });
        })
        .catch(() => undefined);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, check]);

  const status = checked && checked.slug === value && isValidSlug(value) ? (checked.free ? "free" : "taken") : "idle";

  return (
    <Input
      name={name}
      label={t("slug")}
      value={value}
      onChange={(e) => onChange(e.target.value.toLowerCase())}
      onBlur={onBlur}
      hint={status === "free" ? t("slugFree") : t("slugHint")}
      error={error ?? (status === "taken" ? t("slugTaken") : undefined)}
      autoComplete="off"
      spellCheck={false}
    />
  );
}
