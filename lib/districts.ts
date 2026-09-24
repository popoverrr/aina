/**
 * Справочник районов Алматы. `slug` используется в URL-фильтрах каталога,
 * `name` — то, что хранится в Property.district и показывается пользователю.
 */
export const DISTRICTS = [
  { slug: "alatau", name: "Алатауский" },
  { slug: "almaly", name: "Алмалинский" },
  { slug: "auezov", name: "Ауэзовский" },
  { slug: "bostandyk", name: "Бостандыкский" },
  { slug: "zhetysu", name: "Жетысуский" },
  { slug: "medeu", name: "Медеуский" },
  { slug: "nauryzbay", name: "Наурызбайский" },
  { slug: "turksib", name: "Турксибский" },
] as const;

export type DistrictSlug = (typeof DISTRICTS)[number]["slug"];
export type DistrictName = (typeof DISTRICTS)[number]["name"];

export const DISTRICT_NAMES: readonly string[] = DISTRICTS.map((d) => d.name);

export function districtBySlug(slug: string): (typeof DISTRICTS)[number] | undefined {
  return DISTRICTS.find((d) => d.slug === slug);
}

export function districtSlugByName(name: string): DistrictSlug | undefined {
  return DISTRICTS.find((d) => d.name === name)?.slug;
}

/** Из списка slug'ов (в т.ч. неизвестных) — список имён районов для запроса в БД. */
export function districtNamesFromSlugs(slugs: readonly string[]): string[] {
  return slugs.map((s) => districtBySlug(s)?.name).filter((n): n is DistrictName => Boolean(n));
}
