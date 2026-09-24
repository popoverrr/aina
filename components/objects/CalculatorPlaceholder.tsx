import { Calculator } from "lucide-react";
import { useTranslations } from "next-intl";
import { features } from "@/lib/features";

/**
 * Точка расширения этапа 2: блок расчёта окупаемости. Пока за флагом — показывается заглушка.
 * Когда калькулятор будет готов, включить features.calculator и подставить компонент здесь.
 */
export function CalculatorPlaceholder() {
  const t = useTranslations("objects.detail.calculator");
  if (features.calculator) return null;

  return (
    <div className="flex gap-4 rounded-base border border-dashed border-line bg-surface-2 p-5">
      <Calculator className="size-6 shrink-0 text-accent" aria-hidden="true" />
      <div>
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("text")}</p>
      </div>
    </div>
  );
}
