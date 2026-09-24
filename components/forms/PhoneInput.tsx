"use client";

import { forwardRef, type ChangeEvent, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Field";
import { formatPhoneInput } from "@/lib/phone-mask";

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type" | "id"> {
  id?: string;
  label: string;
  error?: string;
  requiredLabel?: string;
  value: string;
  onChange: (value: string) => void;
}

/** Поле телефона с маской. Значение хранится в отформатированном виде, нормализуется в zod. */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput({ value, onChange, ...rest }, ref) {
  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(formatPhoneInput(e.target.value))}
      {...rest}
    />
  );
});
