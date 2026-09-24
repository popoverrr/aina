"use server";

import { AuthError } from "next-auth";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession, signIn, signOut } from "@/auth";
import { TAGS } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, processImage, safeFilename } from "@/lib/images";
import { getStorage, StorageNotConfiguredError } from "@/lib/storage";
import { formatArea } from "@/lib/format";
import {
  caseSchema,
  LEAD_STATUSES,
  propertySchema,
  PROP_STATUSES,
  settingsSchema,
  testimonialSchema,
  type AdminActionResult,
} from "@/lib/validation/admin";
import { flattenFieldErrors } from "@/lib/validation/lead";
import type { Prisma } from "@/lib/generated/prisma/client";

// ---------- Доступ ----------

async function requireAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("UNAUTHORIZED");
}

function revalidatePublic(...tags: string[]): void {
  for (const tag of tags) updateTag(tag);
  revalidatePath("/", "layout");
}

function failure(error: unknown): AdminActionResult<never> {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return { ok: false, formError: "unauthorized" };
  console.error("[admin]", error);
  return { ok: false, formError: error instanceof Error ? error.message : "unknown" };
}

// ---------- Вход / выход ----------

export interface LoginState {
  error?: "invalid" | "notConfigured";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) return { error: "notConfigured" };
  const next = String(formData.get("next") ?? "");
  const redirectTo = next.startsWith("/admin") && !next.includes("login") ? next : "/admin/objects";
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "invalid" };
    throw error; // NEXT_REDIRECT
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}

// ---------- Объекты ----------

export async function checkSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  await requireAdmin();
  const existing = await prisma.property.findUnique({ where: { slug }, select: { id: true } });
  return !existing || existing.id === excludeId;
}

export async function saveProperty(id: string | null, input: unknown): Promise<AdminActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = propertySchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: flattenFieldErrors(parsed.error) };
    const d = parsed.data;

    const taken = await prisma.property.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (taken && taken.id !== id) return { ok: false, fieldErrors: { slug: "slugTaken" } };

    const data: Prisma.PropertyUncheckedCreateInput = {
      title: d.title,
      slug: d.slug,
      externalId: d.externalId,
      kind: d.kind,
      dealType: d.dealType,
      status: d.status,
      district: d.district,
      address: d.address,
      landmark: d.landmark,
      lat: d.lat,
      lng: d.lng,
      areaM2: d.areaM2,
      ceilingM: d.ceilingM,
      floor: d.floor,
      entrance: d.entrance,
      powerKw: d.powerKw,
      hasWetPoint: d.hasWetPoint,
      priceSale: d.priceSale,
      priceRentM2: d.priceRentM2,
      priceRentTotal: d.priceRentTotal,
      utilitiesIncluded: d.utilitiesIncluded,
      isExclusive: d.isExclusive,
      isHot: d.isHot,
      isFeatured: d.isFeatured,
      descriptionMd: d.descriptionMd,
      advantages: d.advantages,
      presentationUrl: d.presentationUrl,
      publishedAt: d.publishedAt,
    };

    const saved = id
      ? await prisma.property.update({ where: { id }, data, select: { id: true } })
      : await prisma.property.create({ data, select: { id: true } });

    revalidatePublic(TAGS.properties);
    return { ok: true, data: { id: saved.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function togglePropertyFlag(id: string, flag: "isHot" | "isFeatured" | "isExclusive", value: boolean): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    await prisma.property.update({ where: { id }, data: { [flag]: value } });
    revalidatePublic(TAGS.properties);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function setPropertyStatus(id: string, status: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    if (!(PROP_STATUSES as readonly string[]).includes(status)) return { ok: false, formError: "invalid status" };
    await prisma.property.update({ where: { id }, data: { status: status as (typeof PROP_STATUSES)[number] } });
    revalidatePublic(TAGS.properties);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteProperty(id: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const images = await prisma.propertyImage.findMany({ where: { propertyId: id }, select: { url: true } });
    await prisma.property.delete({ where: { id } });
    try {
      const storage = getStorage();
      await Promise.allSettled(images.map((img) => storage.remove(img.url)));
    } catch {
      // хранилище не настроено — файлы остаются, запись уже удалена
    }
    revalidatePublic(TAGS.properties);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

// ---------- Фото объектов ----------

export interface UploadedImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  order: number;
}

export async function uploadPropertyImages(propertyId: string, formData: FormData): Promise<AdminActionResult<UploadedImage[]>> {
  try {
    await requireAdmin();
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, kind: true, areaM2: true, district: true, images: { select: { order: true }, orderBy: { order: "desc" }, take: 1 } },
    });
    if (!property) return { ok: false, formError: "not found" };

    let storage;
    try {
      storage = getStorage();
    } catch (error) {
      if (error instanceof StorageNotConfiguredError) return { ok: false, formError: "storageNotConfigured" };
      throw error;
    }

    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return { ok: true, data: [] };

    let order = (property.images[0]?.order ?? -1) + 1;
    const created: UploadedImage[] = [];

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_UPLOAD_BYTES) continue;
      const processed = await processImage(Buffer.from(await file.arrayBuffer()));
      const { url } = await storage.upload({
        buffer: processed.buffer,
        contentType: processed.contentType,
        filename: safeFilename(file.name),
        folder: "properties",
      });
      const alt = `${property.title}, ${formatArea(property.areaM2)}, ${property.district}`;
      const row = await prisma.propertyImage.create({
        data: { propertyId, url, alt, width: processed.width, height: processed.height, order: order++ },
        select: { id: true, url: true, alt: true, width: true, height: true, order: true },
      });
      created.push(row);
    }

    revalidatePublic(TAGS.properties);
    return { ok: true, data: created };
  } catch (error) {
    return failure(error);
  }
}

export async function deletePropertyImage(imageId: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const image = await prisma.propertyImage.delete({ where: { id: imageId }, select: { url: true } });
    try {
      await getStorage().remove(image.url);
    } catch (error) {
      console.error("[admin] remove image file failed:", error);
    }
    revalidatePublic(TAGS.properties);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function reorderPropertyImages(propertyId: string, orderedIds: string[]): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    await prisma.$transaction(
      orderedIds.map((id, index) => prisma.propertyImage.updateMany({ where: { id, propertyId }, data: { order: index } })),
    );
    revalidatePublic(TAGS.properties);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function updatePropertyImageAlt(imageId: string, alt: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    await prisma.propertyImage.update({ where: { id: imageId }, data: { alt: alt.trim().slice(0, 200) } });
    revalidatePublic(TAGS.properties);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

// ---------- Кейсы ----------

export async function checkCaseSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  await requireAdmin();
  const existing = await prisma.case.findUnique({ where: { slug }, select: { id: true } });
  return !existing || existing.id === excludeId;
}

export async function saveCase(id: string | null, input: unknown): Promise<AdminActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = caseSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: flattenFieldErrors(parsed.error) };
    const d = parsed.data;

    const taken = await prisma.case.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (taken && taken.id !== id) return { ok: false, fieldErrors: { slug: "slugTaken" } };

    const data: Prisma.CaseUncheckedCreateInput = {
      title: d.title,
      slug: d.slug,
      kind: d.kind,
      dealType: d.dealType,
      district: d.district,
      areaM2: d.areaM2,
      amountLabel: d.amountLabel,
      durationLabel: d.durationLabel,
      task: d.task,
      solution: d.solution,
      result: d.result,
      isFeatured: d.isFeatured,
      order: d.order,
    };
    const saved = id ? await prisma.case.update({ where: { id }, data, select: { id: true } }) : await prisma.case.create({ data, select: { id: true } });
    revalidatePublic(TAGS.cases);
    return { ok: true, data: { id: saved.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteCase(id: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const removed = await prisma.case.delete({ where: { id }, select: { coverUrl: true } });
    if (removed.coverUrl) {
      try {
        await getStorage().remove(removed.coverUrl);
      } catch {
        // нет хранилища — файл остаётся
      }
    }
    revalidatePublic(TAGS.cases);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function uploadCaseCover(id: string, formData: FormData): Promise<AdminActionResult<{ url: string }>> {
  try {
    await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, formError: "no file" };
    if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_UPLOAD_BYTES) return { ok: false, formError: "bad file" };

    let storage;
    try {
      storage = getStorage();
    } catch (error) {
      if (error instanceof StorageNotConfiguredError) return { ok: false, formError: "storageNotConfigured" };
      throw error;
    }

    const previous = await prisma.case.findUnique({ where: { id }, select: { coverUrl: true } });
    const processed = await processImage(Buffer.from(await file.arrayBuffer()));
    const { url } = await storage.upload({ buffer: processed.buffer, contentType: processed.contentType, filename: safeFilename(file.name), folder: "cases" });
    await prisma.case.update({ where: { id }, data: { coverUrl: url } });
    if (previous?.coverUrl) await storage.remove(previous.coverUrl).catch(() => undefined);

    revalidatePublic(TAGS.cases);
    return { ok: true, data: { url } };
  } catch (error) {
    return failure(error);
  }
}

export async function removeCaseCover(id: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const previous = await prisma.case.findUnique({ where: { id }, select: { coverUrl: true } });
    await prisma.case.update({ where: { id }, data: { coverUrl: null } });
    if (previous?.coverUrl) {
      try {
        await getStorage().remove(previous.coverUrl);
      } catch (error) {
        console.error("[admin] remove cover file failed:", error);
      }
    }
    revalidatePublic(TAGS.cases);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

// ---------- Заявки ----------

export async function setLeadStatus(id: string, status: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    if (!(LEAD_STATUSES as readonly string[]).includes(status)) return { ok: false, formError: "invalid status" };
    await prisma.lead.update({ where: { id }, data: { status: status as (typeof LEAD_STATUSES)[number] } });
    revalidatePath("/admin/leads");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

// ---------- Настройки и отзывы ----------

export async function saveSettings(input: unknown): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: flattenFieldErrors(parsed.error) };
    const d = parsed.data;
    const entries: Array<[string, Record<string, string>]> = [
      ["hero", d.hero],
      ["stats", d.stats],
      ["contacts", d.contacts],
      ["golden", d.golden],
    ];
    await prisma.$transaction(entries.map(([key, value]) => prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })));
    revalidatePublic(TAGS.settings);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function saveTestimonial(id: string | null, input: unknown): Promise<AdminActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = testimonialSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: flattenFieldErrors(parsed.error) };
    const d = parsed.data;
    const saved = id
      ? await prisma.testimonial.update({ where: { id }, data: d, select: { id: true } })
      : await prisma.testimonial.create({ data: d, select: { id: true } });
    revalidatePublic(TAGS.testimonials);
    return { ok: true, data: { id: saved.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteTestimonial(id: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    await prisma.testimonial.delete({ where: { id } });
    revalidatePublic(TAGS.testimonials);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

/** Защита страниц админки: нет сессии — на страницу входа. */
export async function requireAdminPage(nextPath: string): Promise<void> {
  const session = await getAdminSession();
  if (!session) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
}
