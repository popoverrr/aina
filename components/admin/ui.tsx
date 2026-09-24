import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Мелкие строительные блоки админки: заголовок страницы, таблица, панель. */

export function AdminPageHeader({ title, actions, children }: { title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl">{title}</h1>
        {children}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-base border border-line bg-surface p-4 shadow-card sm:p-6", className)}>
      {title ? <h2 className="mb-4 text-lg">{title}</h2> : null}
      {children}
    </section>
  );
}

export function AdminTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-base border border-line bg-surface shadow-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-surface-2 text-left text-xs tracking-wide text-ink-muted uppercase">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn("px-3 py-2.5 font-medium", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const tones = {
    info: "border-line bg-surface-2 text-ink",
    error: "border-hot/40 bg-hot/5 text-hot",
    success: "border-success/40 bg-success/5 text-success",
  };
  return (
    <p role={tone === "error" ? "alert" : "status"} className={cn("rounded-base border px-3 py-2 text-sm", tones[tone])}>
      {children}
    </p>
  );
}
