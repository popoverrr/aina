"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";
import { ImagePlaceholder } from "@/components/ui/Placeholder";
import { cn } from "@/lib/cn";
import type { PublicImage } from "@/lib/properties";

export interface GalleryLabels {
  aria: string;
  prev: string;
  next: string;
  open: string;
  close: string;
  /** шаблон «{current} из {total}» */
  counter: string;
  /** шаблон «Показать фото {n}» */
  thumb: string;
}

interface GalleryProps {
  images: PublicImage[];
  title: string;
  placeholderLabel: string;
  labels: GalleryLabels;
  /** Панель поверх обложки для закрытых объектов */
  overlay?: ReactNode;
}

function fill(template: string, params: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ""));
}

/**
 * Галерея: стрелки, клавиатура (← → в фокусе, Escape закрывает полноэкранный режим),
 * свайп на мобильном, полноэкранный просмотр через <dialog> (нативный focus trap и возврат фокуса).
 * Подписи приходят с сервера — компонент не тянет рантайм словарей.
 */
export function Gallery({ images, title, placeholderLabel, labels, overlay }: GalleryProps) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  const total = images.length;

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setIndex((i) => (i + delta + total) % total);
    },
    [total],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    touchStart.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    const end = e.changedTouches[0]?.clientX;
    touchStart.current = null;
    if (start === null || end === undefined) return;
    const delta = end - start;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const current = images[index];
  const counter = fill(labels.counter, { current: index + 1, total });

  const navButton = (dir: -1 | 1, extra?: string) => (
    <button
      type="button"
      onClick={() => go(dir)}
      aria-label={dir < 0 ? labels.prev : labels.next}
      className={cn(
        "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-card transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        dir < 0 ? "left-3" : "right-3",
        extra,
      )}
    >
      {dir < 0 ? <ChevronLeft className="size-5" aria-hidden="true" /> : <ChevronRight className="size-5" aria-hidden="true" />}
    </button>
  );

  return (
    <div>
      <section
        aria-label={labels.aria}
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-base bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {current ? (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt || title}
            fill
            sizes="(min-width: 1024px) 760px, 100vw"
            className="object-cover"
            priority={index === 0}
          />
        ) : (
          <ImagePlaceholder label={placeholderLabel} />
        )}

        {total > 1 ? (
          <>
            {navButton(-1)}
            {navButton(1)}
            <p className="absolute bottom-3 left-3 z-10 rounded-base bg-ink/70 px-2 py-1 text-xs text-white tabular" aria-live="polite">
              {counter}
            </p>
          </>
        ) : null}

        {current && !overlay ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={labels.open}
            className="absolute right-3 bottom-3 z-10 flex size-10 items-center justify-center rounded-full bg-surface/90 text-ink shadow-card hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Maximize2 className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        {overlay ? <div className="absolute inset-x-0 bottom-0 z-10">{overlay}</div> : null}
      </section>

      {total > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label={labels.aria}>
          {images.map((img, i) => (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={fill(labels.thumb, { n: i + 1 })}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative block h-16 w-22 overflow-hidden rounded-base border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  i === index ? "border-accent" : "border-transparent hover:border-line",
                )}
              >
                <Image src={img.url} alt="" fill sizes="88px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label={title}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-white"
      >
        {open && current ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <Image src={current.url} alt={current.alt || title} fill sizes="100vw" className="object-contain" />
            {total > 1 ? (
              <>
                {navButton(-1, "left-4")}
                {navButton(1, "right-4")}
              </>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-surface/90 text-ink shadow-modal hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-base bg-ink/70 px-3 py-1 text-sm tabular">{counter}</p>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
