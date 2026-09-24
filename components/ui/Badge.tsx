import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "hot" | "accent" | "neutral" | "success" | "muted";

const tones: Record<BadgeTone, string> = {
  hot: "bg-hot text-white",
  accent: "bg-accent text-white",
  neutral: "bg-ink text-white",
  success: "bg-success text-white",
  muted: "bg-surface-2 text-ink-muted border border-line",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-base px-2 text-xs font-medium tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}
