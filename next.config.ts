import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Статичное превью на GitHub Pages (`npm run preview:build`): сайт раздаётся из подпапки
 * репозитория и без сервера, поэтому нужен префикс пути и отключённый оптимизатор картинок.
 * Обычная сборка переменную не задаёт и работает как раньше.
 */
const previewBasePath = process.env.PREVIEW_BASE_PATH?.trim();

const nextConfig: NextConfig = {
  // Драйвер PostgreSQL и адаптер Prisma — только на сервере, без бандлинга.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  // skipTrailingSlashRedirect: без него запрос «/aina/» нормализуется в «/aina», а на таком
  // адресе путь после basePath пустой, matcher в proxy.ts не срабатывает и главная даёт 404.
  ...(previewBasePath ? { basePath: previewBasePath, skipTrailingSlashRedirect: true } : {}),
  images: {
    unoptimized: Boolean(previewBasePath),
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Vercel Blob (фото объектов и обложки кейсов)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
