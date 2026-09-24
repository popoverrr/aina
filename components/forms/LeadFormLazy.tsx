"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";
import { useLazyMount } from "@/components/forms/useLazyMount";
import type { LeadFormProps } from "@/components/forms/LeadForm";

const LeadForm = dynamic(() => import("@/components/forms/LeadForm").then((m) => m.LeadForm), { ssr: false });

/**
 * Обёртка LeadForm с отложенной загрузкой: `placeholder` — та же разметка формы, отрендеренная
 * сервером без JS. Библиотеки валидации подгружаются только когда форма нужна.
 */
export function LeadFormLazy({ placeholder, ...props }: LeadFormProps & { placeholder: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { captured, activate } = useLazyMount(ref);

  return (
    <div ref={ref} onFocusCapture={activate} onPointerDownCapture={activate} onKeyDownCapture={activate}>
      {captured ? <LeadForm {...props} initialValues={captured.values} autoFocusField={captured.focusedField} /> : placeholder}
    </div>
  );
}
