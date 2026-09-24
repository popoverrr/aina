import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { pickMessages, SITE_MESSAGE_KEYS } from "@/i18n/messages";
import { getContacts } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [contacts, t, allMessages] = await Promise.all([getContacts(), getTranslations("common"), getMessages()]);
  const messages = pickMessages(allMessages, SITE_MESSAGE_KEYS);

  return (
    <NextIntlClientProvider messages={messages}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-base focus:bg-surface focus:px-4 focus:py-2 focus:shadow-modal"
      >
        {t("skipToContent")}
      </a>
      <Header contacts={contacts} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer contacts={contacts} />
      <WhatsAppFloat whatsapp={contacts.whatsapp} />
    </NextIntlClientProvider>
  );
}
