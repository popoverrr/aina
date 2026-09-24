import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Драйвер PostgreSQL и адаптер Prisma — только на сервере, без бандлинга.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Vercel Blob (фото объектов и обложки кейсов)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
