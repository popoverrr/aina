"use client";

import { Flame, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { setPropertyStatus, togglePropertyFlag } from "@/lib/actions/admin";
import { cn } from "@/lib/cn";
import { PROP_STATUSES } from "@/lib/validation/admin";

interface QuickActionsProps {
  id: string;
  isHot: boolean;
  isFeatured: boolean;
  status: string;
}

/** Быстрые действия из таблицы: переключить isHot / isFeatured, сменить статус — без захода в карточку. */
export function QuickFlags({ id, isHot, isFeatured }: Pick<QuickActionsProps, "id" | "isHot" | "isFeatured">) {
  const t = useTranslations("admin.objects.flags");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = (flag: "isHot" | "isFeatured", value: boolean) =>
    startTransition(async () => {
      await togglePropertyFlag(id, flag, value);
      router.refresh();
    });

  const btn = (active: boolean) =>
    cn(
      "flex size-8 items-center justify-center rounded-base border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50",
      active ? "border-accent bg-accent text-white" : "border-line text-ink-muted hover:border-ink-muted",
    );

  return (
    <div className="flex gap-1.5" aria-busy={pending}>
      <button type="button" className={btn(isHot)} aria-pressed={isHot} aria-label={t("hot")} title={t("hot")} onClick={() => toggle("isHot", !isHot)} disabled={pending}>
        <Flame className="size-4" aria-hidden="true" />
      </button>
      <button type="button" className={btn(isFeatured)} aria-pressed={isFeatured} aria-label={t("featured")} title={t("featured")} onClick={() => toggle("isFeatured", !isFeatured)} disabled={pending}>
        <Star className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function QuickStatus({ id, status }: Pick<QuickActionsProps, "id" | "status">) {
  const te = useTranslations("enums.status");
  const ta = useTranslations("admin.objects.fields");
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
          await setPropertyStatus(id, next);
          router.refresh();
        });
      }}
      className="h-9 rounded-base border border-line bg-surface px-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none disabled:opacity-50"
    >
      {PROP_STATUSES.map((s) => (
        <option key={s} value={s}>
          {te(s)}
        </option>
      ))}
    </select>
  );
}
