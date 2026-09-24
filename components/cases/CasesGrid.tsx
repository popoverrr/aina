"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CaseGridItem {
  id: string;
  kind: string;
  /** карточка, отрендеренная на сервере */
  node: ReactNode;
}

export interface CasesGridProps {
  items: CaseGridItem[];
  /** типы объектов, встречающиеся в кейсах, с подписями */
  kinds: Array<{ value: string; label: string }>;
  labels: { filterLabel: string; all: string; empty: string };
}

/** Список кейсов с клиентским фильтром по типу объекта — без перезагрузки. Карточки приходят с сервера. */
export function CasesGrid({ items, kinds, labels }: CasesGridProps) {
  const [kind, setKind] = useState<string>("");
  const visible = kind ? items.filter((c) => c.kind === kind) : items;

  const chip = (active: boolean) =>
    cn(
      "h-9 rounded-base border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink-muted",
    );

  return (
    <div>
      {kinds.length > 1 ? (
        <div role="group" aria-label={labels.filterLabel} className="mb-8 flex flex-wrap gap-2">
          <button type="button" className={chip(kind === "")} onClick={() => setKind("")} aria-pressed={kind === ""}>
            {labels.all}
          </button>
          {kinds.map((k) => (
            <button key={k.value} type="button" className={chip(kind === k.value)} onClick={() => setKind(k.value)} aria-pressed={kind === k.value}>
              {k.label}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-ink-muted">{labels.empty}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {visible.map((c) => (
            <li key={c.id}>{c.node}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
