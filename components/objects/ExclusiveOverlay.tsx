import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/Button";

/** Панель поверх обложки закрытого объекта: «Детали и презентация — по запросу» + переход к форме. */
export function ExclusiveOverlay({ targetId }: { targetId: string }) {
  const t = useTranslations("objects.detail");
  return (
    <div className="bg-ink/85 p-4 text-white backdrop-blur-sm sm:p-5">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("exclusive.panelTitle")}</p>
          <p className="mt-1 text-sm text-white/80">{t("exclusive.panelText")}</p>
          <a href={`#${targetId}`} className={buttonClasses("primary", "sm", "mt-3")}>
            {t("request.button")}
          </a>
        </div>
      </div>
    </div>
  );
}
