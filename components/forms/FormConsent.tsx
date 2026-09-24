import type { ReactNode } from "react";

/**
 * Строка согласия под кнопкой — чекбокс не нужен (SPEC.md, раздел 6).
 * Текст со ссылкой (`consent`) собирается на сервере (см. ConsentText), чтобы клиентские формы
 * не тянули рантайм форматирования сообщений.
 */
export function FormConsent({ note, consent }: { note?: string; consent: ReactNode }) {
  return (
    <div className="space-y-1 text-xs text-ink-muted">
      {note ? <p>{note}</p> : null}
      <p>{consent}</p>
    </div>
  );
}

/** Скрытое honeypot-поле: не видно пользователю, но доступно ботам. */
export function HoneypotField({ name = "website", ...rest }: { name?: string } & Record<string, unknown>) {
  return (
    <div className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden" aria-hidden="true">
      <label htmlFor={`${name}-hp`}>Website</label>
      <input id={`${name}-hp`} type="text" tabIndex={-1} autoComplete="off" {...rest} />
    </div>
  );
}
