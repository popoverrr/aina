import { Quote } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import type { TestimonialDto } from "@/lib/testimonials";

/** Отзывы из БД. Блок скрывается, если записей меньше двух. */
export function Testimonials({ items, title, tone = "default" }: { items: TestimonialDto[]; title: string; tone?: "default" | "muted" }) {
  if (items.length < 2) return null;

  return (
    <Section tone={tone} aria-labelledby="testimonials-title">
      <SectionHeader title={<span id="testimonials-title">{title}</span>} />
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-4 rounded-base border border-line bg-surface p-6 shadow-card">
            <Quote className="size-5 text-accent" aria-hidden="true" />
            <blockquote className="flex-1 text-ink">
              <p>{item.text}</p>
            </blockquote>
            <footer className="text-sm">
              <p className="font-medium">{item.author}</p>
              {item.role ? <p className="text-ink-muted">{item.role}</p> : null}
            </footer>
          </li>
        ))}
      </ul>
    </Section>
  );
}
