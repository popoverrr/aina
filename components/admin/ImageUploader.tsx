"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, GripVertical, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { Notice } from "@/components/admin/ui";
import { useAdminErrors } from "@/components/admin/useAdminErrors";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { deletePropertyImage, reorderPropertyImages, updatePropertyImageAlt, uploadPropertyImages, type UploadedImage } from "@/lib/actions/admin";

/**
 * Загрузка фото: drag-n-drop, множественная, превью, перетаскивание для сортировки (плюс кнопки
 * «выше/ниже» для клавиатуры), удаление, подпись alt. Обработка (2000px, WebP) — на сервере.
 */
export function ImageUploader({ propertyId, images: initial, storageReady }: { propertyId: string; images: UploadedImage[]; storageReady: boolean }) {
  const t = useTranslations("admin.objects.photos");
  const tc = useTranslations("admin.common");
  const errorText = useAdminErrors();
  const [images, setImages] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setError(null);
    setUploading(list.length);
    const fd = new FormData();
    list.forEach((f) => fd.append("files", f));
    startTransition(async () => {
      const result = await uploadPropertyImages(propertyId, fd);
      setUploading(0);
      if (!result.ok) {
        setError(errorText(result.formError ?? "unknown") ?? null);
        return;
      }
      setImages((prev) => [...prev, ...result.data]);
    });
  };

  const persistOrder = (next: UploadedImage[]) => {
    setImages(next);
    startTransition(async () => {
      const result = await reorderPropertyImages(
        propertyId,
        next.map((i) => i.id),
      );
      if (!result.ok) setError(errorText(result.formError ?? "unknown") ?? null);
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    persistOrder(next);
  };

  const remove = (id: string) => {
    if (!window.confirm(tc("confirmDelete"))) return;
    startTransition(async () => {
      const result = await deletePropertyImage(id);
      if (!result.ok) {
        setError(errorText(result.formError ?? "unknown") ?? null);
        return;
      }
      setImages((prev) => prev.filter((i) => i.id !== id));
    });
  };

  const saveAlt = (id: string, alt: string) => {
    startTransition(async () => {
      await updatePropertyImageAlt(id, alt);
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {!storageReady ? <Notice tone="error">{t("notConfigured")}</Notice> : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-base border-2 border-dashed p-8 text-center transition-colors",
          dragOver ? "border-accent bg-accent/5" : "border-line bg-surface-2",
        )}
      >
        <Upload className="size-6 text-ink-muted" aria-hidden="true" />
        <p className="text-sm">{t("dropzone")}</p>
        <p className="text-xs text-ink-muted">{t("hint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          id="property-images-input"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={!storageReady || pending} loading={uploading > 0} loadingText={t("uploading", { n: uploading })}>
          {t("choose")}
        </Button>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {images.length ? (
        <>
          <p className="text-xs text-ink-muted">{t("reorderHint")}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy={pending}>
            {images.map((img, index) => (
              <li
                key={img.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) move(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={cn("rounded-base border border-line bg-surface p-2", dragIndex === index && "opacity-50")}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-base bg-surface-2">
                  <Image src={img.url} alt={img.alt} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
                  <span className="absolute top-2 left-2 rounded-base bg-ink/70 px-1.5 text-xs text-white tabular">{index + 1}</span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <GripVertical className="size-4 cursor-grab text-ink-muted" aria-hidden="true" />
                  <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={t("moveUp")} className="rounded-base p-1.5 hover:bg-surface-2 disabled:opacity-40">
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => move(index, index + 1)} disabled={index === images.length - 1} aria-label={t("moveDown")} className="rounded-base p-1.5 hover:bg-surface-2 disabled:opacity-40">
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => remove(img.id)} aria-label={t("delete")} className="ml-auto rounded-base p-1.5 text-hot hover:bg-hot/10">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <label className="mt-2 block text-xs text-ink-muted">
                  {t("alt")}
                  <input
                    type="text"
                    defaultValue={img.alt}
                    onBlur={(e) => {
                      if (e.target.value !== img.alt) saveAlt(img.id, e.target.value);
                    }}
                    className="mt-1 h-9 w-full rounded-base border border-line bg-surface px-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none"
                  />
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
