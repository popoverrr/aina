"use client";

import { useEffect, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Sticky-панель на мобильном: цена + кнопка «Запросить» фиксируются снизу.
 * Помечает body атрибутом data-sticky, чтобы плавающая кнопка WhatsApp поднялась выше панели.
 */
export function StickyPanel({ price, label, targetId }: { price: ReactNode; label: string; targetId: string }) {
  useEffect(() => {
    document.body.dataset.sticky = "1";
    return () => {
      delete document.body.dataset.sticky;
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/90 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">{price}</div>
        <a href={`#${targetId}`} className={buttonClasses("primary", "md", "shrink-0")}>
          {label}
        </a>
      </div>
    </div>
  );
}
