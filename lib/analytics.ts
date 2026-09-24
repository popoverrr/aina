"use client";

import { site } from "@/site.config";

/**
 * Единая точка отправки событий в GA4 и Яндекс Метрику. Если счётчики не настроены — no-op.
 * Основное событие — `lead_submit` с параметром типа заявки (SPEC.md, раздел 6, шаг 6).
 */
export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}): void {
  if (typeof window === "undefined") return;

  if (site.analytics.ga4 && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }

  if (site.analytics.metrika && typeof window.ym === "function") {
    window.ym(Number(site.analytics.metrika), "reachGoal", name, params);
  }
}

export function trackLeadSubmit(leadType: string): void {
  trackEvent("lead_submit", { lead_type: leadType });
}
