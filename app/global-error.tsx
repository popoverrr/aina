"use client";

/** Ошибка на уровне корневого layout — здесь нет провайдеров и словарей, поэтому текст статичен. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "48px 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.75rem" }}>Что-то пошло не так</h1>
        <p style={{ color: "#5A6674" }}>Страница не открылась. Попробуйте обновить её.</p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: 24, padding: "12px 20px", borderRadius: 8, border: 0, background: "#8A6A3B", color: "#fff", cursor: "pointer" }}
        >
          Обновить
        </button>
      </body>
    </html>
  );
}
