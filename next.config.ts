import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Статическая сборка (`npm run build:static` для домена, `npm run preview:build` для GitHub Pages):
 * сайт раздаётся файлами, без Node-сервера, поэтому оптимизатор картинок отключается.
 * Превью вдобавок живёт в подпапке репозитория — для него задаётся префикс пути.
 * Обычная серверная сборка переменных не задаёт и работает как раньше.
 */
const staticSnapshot = process.env.STATIC_SNAPSHOT === "1";
const previewBasePath = process.env.PREVIEW_BASE_PATH?.trim();

const nextConfig: NextConfig = {
  // Драйвер PostgreSQL и адаптер Prisma — только на сервере, без бандлинга.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  // skipTrailingSlashRedirect: без него запрос «/aina/» нормализуется в «/aina», а на таком
  // адресе путь после basePath пустой, matcher в proxy.ts не срабатывает и главная даёт 404.
  ...(previewBasePath ? { basePath: previewBasePath, skipTrailingSlashRedirect: true } : {}),
  images: {
    unoptimized: staticSnapshot || Boolean(previewBasePath),
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Vercel Blob (фото объектов и обложки кейсов)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
