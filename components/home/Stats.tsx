import { useTranslations } from "next-intl";
import { FillIn } from "@/components/ui/Placeholder";

export interface StatsValues {
  years: string | number | null;
  volume: string | null;
  objects: string | number | null;
  avgDeal: string | null;
}

/** Полоса цифр: 4 показателя. Незаполненные — видимая заглушка, не выдуманное число. */
export function Stats({ values }: { values: StatsValues }) {
  const t = useTranslations("home.stats");
  const items: Array<{ label: string; value: string | number | null }> = [
    { label: t("years"), value: values.years },
    { label: t("volume"), value: values.volume },
    { label: t("objects"), value: values.objects },
    { label: t("avgDeal"), value: values.avgDeal },
  ];

  return (
    <section aria-label={t("aria")} className="border-b border-line">
      <dl className="container-site grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 lg:py-12">
        {items.map((item) => (
          <div key={item.label}>
            <dd className="text-2xl font-semibold tabular md:text-3xl">
              <FillIn value={item.value} className="text-sm font-medium" />
            </dd>
            <dt className="mt-1 text-sm text-ink-muted">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
