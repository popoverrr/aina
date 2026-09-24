import { MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/site.config";

/**
 * Плавающая кнопка WhatsApp: справа снизу на всех публичных страницах.
 * На карточке объекта sticky-панель ставит body[data-sticky] — кнопка поднимается выше панели.
 */
export async function WhatsAppFloat({ whatsapp }: { whatsapp: string }) {
  const t = await getTranslations("common");
  const href = whatsappLink(t("whatsappPreset")).replace(/wa\.me\/\d+/, `wa.me/${whatsapp}`);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("actions.whatsappFloat")}
      className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-success text-white shadow-card transition-[bottom,transform,filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success active:scale-95 [body[data-sticky]_&]:bottom-24 md:right-6 md:bottom-6 md:[body[data-sticky]_&]:bottom-6"
    >
      <MessageCircle className="size-7" aria-hidden="true" />
    </a>
  );
}
