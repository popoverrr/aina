"use client";

import { useEffect } from "react";
import { trackLeadSubmit } from "@/lib/analytics";

/** Цель `lead_submit` с типом заявки — отправляется один раз при показе страницы /thanks. */
export function LeadSubmitEvent({ leadType }: { leadType: string }) {
  useEffect(() => {
    trackLeadSubmit(leadType);
  }, [leadType]);
  return null;
}
