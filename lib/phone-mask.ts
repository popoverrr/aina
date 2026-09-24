/**
 * Маска телефона для полей ввода: +7 (___) ___-__-__ для казахстанских номеров,
 * международные (начинаются с «+» и не с 7) — без маски, только «+» и цифры.
 */
export function formatPhoneInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return "+";

  const international = trimmed.startsWith("+") && !digits.startsWith("7") && !digits.startsWith("8");
  if (international) return `+${digits.slice(0, 15)}`;

  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, 11);

  const a = digits.slice(1, 4);
  const b = digits.slice(4, 7);
  const c = digits.slice(7, 9);
  const d = digits.slice(9, 11);

  let out = "+7";
  if (a) out += ` (${a}`;
  if (a.length === 3) out += ")";
  if (b) out += ` ${b}`;
  if (c) out += `-${c}`;
  if (d) out += `-${d}`;
  return out;
}
