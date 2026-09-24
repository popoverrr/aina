"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/i18n/navigation";
import { Notice } from "@/components/admin/ui";
import { useAdminErrors } from "@/components/admin/useAdminErrors";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Textarea } from "@/components/ui/Field";
import { deleteTestimonial, saveTestimonial } from "@/lib/actions/admin";
import { testimonialSchema, type TestimonialFormInput, type TestimonialFormValues } from "@/lib/validation/admin";

export interface TestimonialItem {
  id: string;
  author: string;
  role: string | null;
  text: string;
  order: number;
  isPublic: boolean;
}

/** Отзывы: простая таблица с инлайн-формами редактирования и добавлением. */
export function TestimonialsEditor({ items }: { items: TestimonialItem[] }) {
  const t = useTranslations("admin.settings.testimonials");
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      {items.length === 0 && !adding ? <p className="text-sm text-ink-muted">{t("empty")}</p> : null}
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-base border border-line p-4">
            <TestimonialForm item={item} />
          </li>
        ))}
      </ul>
      {adding ? (
        <div className="rounded-base border border-accent/40 p-4">
          <TestimonialForm onDone={() => setAdding(false)} />
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden="true" />
          {t("add")}
        </Button>
      )}
    </div>
  );
}

function TestimonialForm({ item, onDone }: { item?: TestimonialItem; onDone?: () => void }) {
  const t = useTranslations("admin.settings.testimonials");
  const tc = useTranslations("admin.common");
  const errorText = useAdminErrors();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TestimonialFormInput, unknown, TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: item
      ? { author: item.author, role: item.role ?? "", text: item.text, order: String(item.order), isPublic: item.isPublic }
      : { author: "", role: "", text: "", order: "0", isPublic: true },
  });

  const onSubmit = (values: TestimonialFormValues) => {
    setNotice(null);
    startTransition(async () => {
      const result = await saveTestimonial(item?.id ?? null, values);
      if (!result.ok) {
        setNotice(errorText(result.formError ?? "unknown") ?? null);
        return;
      }
      if (!item) reset();
      onDone?.();
      router.refresh();
    });
  };

  const remove = () => {
    if (!item || !window.confirm(tc("confirmDelete"))) return;
    startTransition(async () => {
      await deleteTestimonial(item.id);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={t("author")} required error={errorText(errors.author?.message)} {...register("author")} />
        <Input label={t("role")} {...register("role")} />
      </div>
      <Textarea label={t("text")} rows={3} required error={errorText(errors.text?.message)} {...register("text")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={t("order")} inputMode="numeric" error={errorText(errors.order?.message)} {...register("order")} />
        <Checkbox label={t("isPublic")} wrapperClassName="self-end pb-3" {...register("isPublic")} />
      </div>
      {notice ? <Notice tone="error">{notice}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {item ? tc("save") : tc("create")}
        </Button>
        {item ? (
          <Button variant="danger" size="sm" onClick={remove} disabled={pending}>
            {tc("delete")}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onDone}>
            {tc("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
