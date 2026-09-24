/**
 * Единственное место форматирования чисел, цен и площадей.
 * Никогда не форматируй цену инлайново в компоненте.
 */

const NBSP = " ";

/** Разряды через неразрывный пробел: 12 500 000 */
export function formatNumber(value: number, fractionDigits = 0): string {
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [intPart, fracPart] = fixed.split(".");
  const grouped = (intPart ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const sign = value < 0 ? "−" : "";
  return fracPart ? `${sign}${grouped},${fracPart}` : `${sign}${grouped}`;
}

/** Цена в тенге: `12 500 000 ₸`. null/undefined → пустая строка (решение «что показать» — у вызывающего). */
export function formatPrice(value: number | null | undefined, suffix?: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  const base = `${formatNumber(value)}${NBSP}₸`;
  return suffix ? `${base}${suffix}` : base;
}

/** Цена за м² в месяц: `6 500 ₸/м²` */
export function formatPricePerM2(value: number | null | undefined): string {
  return formatPrice(value, "/м²");
}

/** Площадь: `120 м²`, дробные — до одного знака. */
export function formatArea(m2: number | null | undefined): string {
  if (m2 === null || m2 === undefined || Number.isNaN(m2)) return "";
  const digits = Number.isInteger(m2) ? 0 : 1;
  return `${formatNumber(m2, digits)}${NBSP}м²`;
}

/** Диапазон площади для закрытых объектов: `100–150 м²` (округление к «красивым» границам). */
export function formatAreaRange(m2: number): string {
  const step = m2 < 100 ? 10 : m2 < 500 ? 50 : 100;
  const from = Math.floor(m2 / step) * step;
  const to = from + step;
  return `${formatNumber(from)}–${formatNumber(to)}${NBSP}м²`;
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Intl.DateTimeFormat("ru-RU", { ...opts, timeZone: "Asia/Almaty" }).format(d);
}

/** Телефон в виде +7 701 085 77 17 из любого формата. */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7${NBSP}${digits.slice(1, 4)}${NBSP}${digits.slice(4, 7)}${NBSP}${digits.slice(7, 9)}${NBSP}${digits.slice(9, 11)}`;
  }
  return phone.startsWith("+") ? phone : `+${digits}`;
}

/** Нормализация телефона к E.164: +77010857717. Возвращает null, если номер не распознан. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // Казахстан: 8 XXX XXX XX XX → +7 XXX XXX XX XX
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("7")) return `+7${digits}`;
  // Международный: 10–15 цифр
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}
