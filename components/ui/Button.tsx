import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "whatsapp";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-base font-medium whitespace-nowrap " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px select-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-ink disabled:hover:bg-accent",
  secondary: "border border-ink text-ink bg-transparent hover:bg-ink hover:text-white disabled:hover:bg-transparent disabled:hover:text-ink",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-hot text-white hover:brightness-90",
  whatsapp: "bg-success text-white hover:brightness-95",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-13 px-6 text-base sm:text-lg",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string): string {
  return cn(base, variants[variant], sizes[size], extra);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  external?: boolean;
  ariaLabel?: string;
}

/** Ссылка в виде кнопки. Внутренние — через локале-зависимый Link, внешние — обычный <a>. */
export function ButtonLink({ href, variant = "primary", size = "md", className, children, external, ariaLabel }: ButtonLinkProps) {
  const classes = buttonClasses(variant, size, className);
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
