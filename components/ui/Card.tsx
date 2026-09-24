import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Карточка — единственная «тень карточки» на сайте. */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-base border border-line bg-surface shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}
