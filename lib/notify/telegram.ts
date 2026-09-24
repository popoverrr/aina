/**
 * Уведомление о новой заявке в Telegram (Bot API sendMessage, parse_mode HTML).
 * Без TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID модуль тихо отключён.
 * Ошибки логируются и никогда не показываются пользователю.
 */

export interface LeadNotification {
  typeLabel: string;
  name: string;
  phone: string;
  objectLabel?: string;
  comment?: string;
  brief?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pagePath?: string;
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatTelegramMessage(lead: LeadNotification): string {
  const lines: string[] = [`🔔 <b>Новая заявка: ${esc(lead.typeLabel)}</b>`, ""];
  lines.push(`Имя: ${esc(lead.name)}`);
  // Телефон отдельной строкой — копируется одним тапом
  lines.push(`Телефон: <code>${esc(lead.phone)}</code>`);
  if (lead.objectLabel) lines.push(`Объект: ${esc(lead.objectLabel)}`);
  if (lead.brief) lines.push(`Бриф: ${esc(lead.brief)}`);
  if (lead.comment) lines.push(`Комментарий: ${esc(lead.comment)}`);
  lines.push("");
  const source = [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ");
  lines.push(`Источник: ${esc(source || "прямой заход")}`);
  if (lead.pagePath) lines.push(`Страница: ${esc(lead.pagePath)}`);
  return lines.join("\n");
}

export async function sendTelegramNotification(lead: LeadNotification): Promise<{ skipped: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { skipped: true };

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatTelegramMessage(lead),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: ${response.status} ${await response.text()}`);
  }
  return { skipped: false };
}
