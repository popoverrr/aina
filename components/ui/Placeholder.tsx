import { ImageOff } from "lucide-react";
import { isPlaceholder } from "@/site.config";
import { cn } from "@/lib/cn";

/**
 * Незаполненный факт выводится как видимая заглушка «[ЗАПОЛНИТЬ: …]», а не как выдуманное значение.
 * Компонент принимает строку из site.config / словаря и подсвечивает её, если это заглушка.
 */
export function FillIn({ value, className }: { value: string | number | null | undefined; className?: string }) {
  if (isPlaceholder(value)) {
    const text = typeof value === "string" ? value : "[ЗАПОЛНИТЬ]";
    return <mark className={cn("placeholder-mark", className)}>{text}</mark>;
  }
  return <>{value}</>;
}

/** Абзацы текста; заглушки подсвечиваются целиком. */
export function FillInText({ value, className }: { value: string; className?: string }) {
  if (isPlaceholder(value)) {
    return (
      <p className={className}>
        <mark className="placeholder-mark">{value}</mark>
      </p>
    );
  }
  return (
    <div className={cn("prose-site", className)}>
      {value
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}

const PLACEHOLDER_RE = /(\[ЗАПОЛНИТЬ[^\]]*\])/g;

/** Подсвечивает все вхождения «[ЗАПОЛНИТЬ: …]» внутри готовой строки. */
export function HighlightPlaceholders({ text }: { text: string }) {
  const parts = text.split(PLACEHOLDER_RE);
  return (
    <>
      {parts.map((part, i) =>
        PLACEHOLDER_RE.test(part) ? (
          <mark key={i} className="placeholder-mark">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** Заглушка недостающего изображения — с видимой надписью, не выдуманная картинка. */
export function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-line bg-surface-2 p-4 text-center text-xs text-ink-muted",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <ImageOff className="size-6 opacity-60" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
