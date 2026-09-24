import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/ui/Placeholder";
import type { CaseDto } from "@/lib/cases";

interface CaseCardProps {
  item: CaseDto;
  withCover?: boolean;
  /** h2 в списке кейсов (под h1), h3 внутри секций с h2 */
  headingLevel?: "h2" | "h3";
}

/** Формат карточки: тип объекта → задача одной строкой → результат с цифрой → срок. */
export function CaseCard({ item, withCover = true, headingLevel = "h3" }: CaseCardProps) {
  const t = useTranslations("cases");
  const tc = useTranslations("common");
  const te = useTranslations("enums");
  const Heading = headingLevel;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-base border border-line bg-surface shadow-card transition-[border-color] hover:border-ink-muted/60 focus-within:border-accent">
      {withCover ? (
        <div className="relative aspect-[16/9] w-full bg-surface-2">
          {item.coverUrl ? (
            <Image src={item.coverUrl} alt={t("detail.coverAlt", { title: item.title })} fill sizes="(min-width: 1024px) 373px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
          ) : (
            <ImagePlaceholder label={tc("placeholders.caseCover")} />
          )}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="muted">{te(`kind.${item.kind}`)}</Badge>
          <Badge tone="muted">{te(`deal.${item.dealType}`)}</Badge>
        </div>
        <Heading className="text-lg leading-snug font-semibold">
          <Link href={`/cases/${item.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {item.title}
          </Link>
        </Heading>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-ink-muted">{t("card.task")}</dt>
            <dd className="line-clamp-2">{item.task}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t("card.result")}</dt>
            <dd className="line-clamp-2 font-medium">{item.result}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="text-ink-muted tabular">{item.durationLabel ?? ""}</span>
          <span className="inline-flex items-center gap-1 font-medium text-accent-ink group-hover:underline">
            {t("card.read")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
