"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { setLeadStatus } from "@/lib/actions/admin";
import { LEAD_STATUSES } from "@/lib/validation/admin";

export function LeadStatusSelect({ id, status }: { id: string; status: string }) {
  const te = useTranslations("enums.leadStatus");
  const ta = useTranslations("admin.leads.columns");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label={ta("status")}
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await setLeadStatus(id, next);
          router.refresh();
        });
      }}
      className="h-9 rounded-base border border-line bg-surface px-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none disabled:opacity-50"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {te(s)}
        </option>
      ))}
    </select>
  );
}
