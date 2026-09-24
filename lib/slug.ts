/** Транслитерация кириллицы (ru + kk) в латиницу для slug'ов. */
const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // казахские буквы
  ә: "a", ғ: "g", қ: "q", ң: "n", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i",
};

export function transliterate(input: string): string {
  return Array.from(input.toLowerCase())
    .map((ch) => MAP[ch] ?? ch)
    .join("");
}

/** «Стрит-ритейл на Абая, 120 м²» → «strit-riteyl-na-abaya-120-m2» */
export function slugify(input: string): string {
  return transliterate(input)
    .replace(/²/g, "2")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
