import { Calculator, ClipboardList, FileCheck2, Handshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/ui/Section";

const STEPS = [
  { key: "1", Icon: ClipboardList },
  { key: "2", Icon: Calculator },
  { key: "3", Icon: Handshake },
  { key: "4", Icon: FileCheck2 },
] as const;

/** Как я работаю: 4 шага, иконки lucide, без излишеств. */
export function HowIWork() {
  const t = useTranslations("home.how");
  return (
    <Section aria-labelledby="how-title">
      <SectionHeader title={<span id="how-title">{t("title")}</span>} />
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ key, Icon }, i) => (
          <li key={key} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Icon className="size-6 text-accent" aria-hidden="true" />
              <span className="text-sm font-medium text-ink-muted tabular">0{i + 1}</span>
            </div>
            <h3>{t(`steps.${key}.title`)}</h3>
            <p className="text-sm text-ink-muted">{t(`steps.${key}.text`)}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
