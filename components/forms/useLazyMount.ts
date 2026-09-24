"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export interface CapturedState {
  values: Record<string, string>;
  focusedField?: string;
}

/**
 * Отложенная гидрация тяжёлых форм: пока форма не приблизилась к экрану, на странице лежит
 * статичная разметка без JS-библиотек. Когда блок в 600px от viewport (или пользователь
 * коснулся поля) — загружаем настоящую форму, перенося уже введённые значения и фокус.
 */
export function useLazyMount(ref: RefObject<HTMLElement | null>) {
  const [captured, setCaptured] = useState<CapturedState | null>(null);
  const armed = useRef(false);

  const activate = () => {
    if (armed.current) return;
    armed.current = true;
    const root = ref.current;
    const values: Record<string, string> = {};
    let focusedField: string | undefined;
    if (root) {
      root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]").forEach((el) => {
        if (el.type === "hidden") return;
        values[el.name] = el.value;
        if (document.activeElement === el) focusedField = el.name;
      });
    }
    setCaptured({ values, focusedField });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          activate();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activate стабилен по смыслу (guard через ref)
  }, [ref]);

  return { captured, activate };
}
