import { getTranslations } from "next-intl/server";
import { ConsentText } from "@/components/forms/ConsentText";
import { LeadFormLazy } from "@/components/forms/LeadFormLazy";
import { FormConsent } from "@/components/forms/FormConsent";
import type { LeadFormProps } from "@/components/forms/LeadForm";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";

/**
 * Серверная обёртка: рендерит статичную копию формы (без JS) как placeholder и передаёт её
 * в LeadFormLazy. Разметка полей 1:1 совпадает с LeadForm — при подмене ничего не прыгает.
 */
export async function LeadFormDeferred(props: Omit<LeadFormProps, "consent">) {
  const t = await getTranslations("forms");
  const { compact = false, idPrefix = "lead", submitLabel, note } = props;
  const consent = <ConsentText />;

  // Не <form>: до гидрации ничего не должно отправляться нативно (Enter в поле, клик по кнопке).
  const placeholder = (
    <div className="relative space-y-4" aria-busy="true">
      <div className={compact ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        <Input id={`${idPrefix}-name`} name="name" label={t("labels.name")} placeholder={t("labels.namePlaceholder")} autoComplete="name" required requiredLabel={t("requiredMark")} />
        <Input id={`${idPrefix}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" label={t("labels.phone")} placeholder={t("labels.phonePlaceholder")} required requiredLabel={t("requiredMark")} />
      </div>
      <Textarea id={`${idPrefix}-comment`} name="comment" label={t("labels.commentOptional")} rows={compact ? 3 : 4} />
      <div className="space-y-3">
        <Button type="button" size="lg" className="w-full sm:w-auto">
          {submitLabel ?? t("labels.submit")}
        </Button>
        <FormConsent note={note} consent={consent} />
      </div>
    </div>
  );

  return <LeadFormLazy {...props} consent={consent} placeholder={placeholder} />;
}
