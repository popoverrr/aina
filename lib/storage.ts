import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

/**
 * Хранилище файлов за единым интерфейсом, чтобы Vercel Blob можно было заменить на S3,
 * не трогая админку. Выбор драйвера:
 *   - есть BLOB_READ_WRITE_TOKEN → Vercel Blob;
 *   - нет токена и NODE_ENV !== production → локальная папка public/uploads (только для разработки);
 *   - нет токена в production → загрузка отключена, админка показывает понятное сообщение.
 */

export interface UploadInput {
  buffer: Buffer;
  contentType: string;
  /** Имя файла без пути, уже безопасное (латиница, цифры, дефис, расширение). */
  filename: string;
  /** Подпапка: "properties" | "cases" */
  folder: string;
}

export interface StorageDriver {
  readonly name: "vercel-blob" | "local";
  upload(input: UploadInput): Promise<{ url: string }>;
  remove(url: string): Promise<void>;
}

const blobDriver: StorageDriver = {
  name: "vercel-blob",
  async upload({ buffer, contentType, filename, folder }) {
    const result = await put(`${folder}/${filename}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return { url: result.url };
  },
  async remove(url) {
    await del(url);
  },
};

const localDriver: StorageDriver = {
  name: "local",
  async upload({ buffer, filename, folder }) {
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${filename}`;
    await writeFile(path.join(dir, unique), buffer);
    return { url: `/uploads/${folder}/${unique}` };
  },
  async remove(url) {
    if (!url.startsWith("/uploads/")) return;
    const safe = path.normalize(url).replace(/^([/\\])+/, "");
    const target = path.join(process.cwd(), "public", safe);
    if (!target.startsWith(path.join(process.cwd(), "public", "uploads"))) return;
    await unlink(target).catch(() => undefined);
  },
};

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("BLOB_READ_WRITE_TOKEN не задан: загрузка файлов отключена");
    this.name = "StorageNotConfiguredError";
  }
}

export function getStorage(): StorageDriver {
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobDriver;
  if (process.env.NODE_ENV !== "production") return localDriver;
  throw new StorageNotConfiguredError();
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) || process.env.NODE_ENV !== "production";
}
