import type { MetadataRoute } from "next";
import { getAllCases } from "@/lib/cases";
import { getPublicPropertySlugs } from "@/lib/properties";
import { siteUrl } from "@/site.config";

export const revalidate = 3600;

/** Динамическая карта сайта: статические страницы + объекты и кейсы из БД. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [properties, cases] = await Promise.all([getPublicPropertySlugs(), getAllCases()]);
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/objects`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/cases`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/owners`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contacts`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [
    ...staticPages,
    ...properties.map((p) => ({ url: `${base}/objects/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...cases.map((c) => ({ url: `${base}/cases/${c.slug}`, lastModified: new Date(c.createdAt), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
