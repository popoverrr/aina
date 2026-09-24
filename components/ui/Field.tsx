import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Поля форм: каждое поле имеет <label>, ошибка связана через aria-describedby,
 * состояния покоя / фокуса / ошибки / отключения заданы классами.
 */

const control =
  "w-full rounded-base border bg-surface px-3.5 text-ink placeholder:text-ink-muted/70 " +
  "transition-[border-color,box-shadow] duration-150 " +
  "hover:border-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70 " +
  "aria-invalid:border-hot aria-invalid:focus:ring-hot/25";

interface FieldShellProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  requiredLabel?: string;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, hint, error, required, requiredLabel, className, children }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="text-hot" aria-label={requiredLabel} title={requiredLabel}>
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-hot">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  requiredLabel?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, required, requiredLabel, className, wrapperClassName, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} requiredLabel={requiredLabel} className={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        className={cn(control, "h-11", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        aria-required={required || undefined}
        {...rest}
      />
    </FieldShell>
  );
});

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  requiredLabel?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, hint, error, required, requiredLabel, className, wrapperClassName, rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} requiredLabel={requiredLabel} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={cn(control, "py-2.5 resize-y min-h-24", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        aria-required={required || undefined}
        {...rest}
      />
    </FieldShell>
  );
});

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  requiredLabel?: string;
  wrapperClassName?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, hint, error, required, requiredLabel, className, wrapperClassName, options, placeholder, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} requiredLabel={requiredLabel} className={wrapperClassName}>
      <select
        ref={ref}
        id={fieldId}
        className={cn(control, "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235A6674%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat pr-10", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        aria-required={required || undefined}
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  wrapperClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, description, className, wrapperClassName, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label htmlFor={fieldId} className={cn("flex cursor-pointer items-start gap-3 text-sm", rest.disabled && "cursor-not-allowed opacity-60", wrapperClassName)}>
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        className={cn(
          "mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-base border border-line bg-surface transition-colors",
          "checked:border-accent checked:bg-accent checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M20 6 9 17l-5-5%22/></svg>')] bg-[length:14px_14px] bg-center bg-no-repeat",
          "hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed",
          className,
        )}
        {...rest}
      />
      <span>
        <span className="font-medium text-ink">{label}</span>
        {description ? <span className="block text-ink-muted">{description}</span> : null}
      </span>
    </label>
  );
});
