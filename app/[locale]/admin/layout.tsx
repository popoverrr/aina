import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { getAdminSession } from "@/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { ADMIN_MESSAGE_KEYS, pickMessages } from "@/i18n/messages";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: { absolute: "Админка" },
  robots: { index: false, follow: false },
};

/**
 * Отдельный layout админки: без шапки и подвала публичного сайта.
 * Навигация показывается только при активной сессии; страницы входа рендерятся «голыми».
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [session, allMessages] = await Promise.all([getAdminSession(), getMessages()]);
  const messages = pickMessages(allMessages, ADMIN_MESSAGE_KEYS);

  if (!session) {
    return (
      <NextIntlClientProvider messages={messages}>
        <div className="min-h-dvh bg-surface-2">{children}</div>
      </NextIntlClientProvider>
    );
  }

  const newLeads = await prisma.lead.count({ where: { status: "NEW" } }).catch(() => 0);

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-dvh bg-surface-2 lg:grid lg:grid-cols-[240px_1fr]">
        <AdminNav email={session.email} newLeads={newLeads} />
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
