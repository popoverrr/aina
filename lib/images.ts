import sharp from "sharp";

/**
 * Обработка загружаемых фото: поворот по EXIF, ресайз до ширины 2000px (без увеличения),
 * конвертация в WebP. Оригинал не хранится.
 */
export const MAX_IMAGE_WIDTH = 2000;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"]);

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  contentType: "image/webp";
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const pipeline = sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height, contentType: "image/webp" };
}

/** Безопасное имя файла: латиница, цифры, дефис. */
export function safeFilename(original: string, ext = "webp"): string {
  const base = original
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "image"}.${ext}`;
}
