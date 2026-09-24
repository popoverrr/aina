import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: "default" | "muted";
  as?: "section" | "div";
  children: ReactNode;
}

/** Секция с вертикальным ритмом 64/96px и чередующимся фоном. */
export function Section({ tone = "default", as = "section", className, children, ...rest }: SectionProps) {
  const Tag = as;
  return (
    <Tag className={cn("section-y", tone === "muted" && "bg-surface-2", className)} {...rest}>
      <div className="container-site">{children}</div>
    </Tag>
  );
}

interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}

export function SectionHeader({ title, subtitle, action, as = "h2", className }: SectionHeaderProps) {
  const Heading = as;
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-12", className)}>
      <div className="max-w-2xl">
        <Heading>{title}</Heading>
        {subtitle ? <p className="mt-3 text-ink-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
