import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Analytics } from "@/components/layout/Analytics";
import { pickMessages } from "@/i18n/messages";
import { routing } from "@/i18n/routing";
import { site, siteUrl } from "@/site.config";
import "../globals.css";

const inter = Inter({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-inter",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  const name = site.agent.shortName;
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: t("defaultTitle", { name }),
      template: t("titleTemplate", { title: "%s", name }),
    },
    description: t("defaultDescription"),
    openGraph: {
      type: "website",
      locale: "ru_KZ",
      siteName: name,
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
    icons: { icon: "/agent/avatar-160.jpg", apple: "/agent/avatar-160.jpg" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  // Корневой провайдер — минимум (для error.tsx); вложенные layout'ы отдают свои подмножества.
  const messages = pickMessages(await getMessages(), ["common"]);

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
