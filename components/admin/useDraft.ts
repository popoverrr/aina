"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Автосохранение черновика формы в localStorage, чтобы не потерять текст при случайном закрытии.
 * При открытии формы с сохранённым черновиком предлагает восстановить его.
 */

const DRAFT_EVENT = "ayna:draft";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(DRAFT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DRAFT_EVENT, callback);
  };
}

function readFlag(key: string): boolean {
  try {
    return Boolean(localStorage.getItem(key));
  } catch {
    return false;
  }
}

export function useDraft<T extends FieldValues>(key: string, form: UseFormReturn<T, unknown, FieldValues>) {
  const storageKey = `draft:${key}`;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDraft = useSyncExternalStore(
    subscribe,
    () => readFlag(storageKey),
    () => false,
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(values));
        } catch {
          // localStorage недоступен (приватный режим) — черновик не сохраняем
        }
      }, 800);
    });
    return () => {
      subscription.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, storageKey]);

  const restore = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) form.reset(JSON.parse(raw) as T);
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(DRAFT_EVENT));
  }, [form, storageKey]);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(DRAFT_EVENT));
  }, [storageKey]);

  return { hasDraft, restore, clear };
}
