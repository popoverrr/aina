import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** «Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности» со ссылкой — рендерится на сервере. */
export async function ConsentText() {
  const t = await getTranslations("forms");
  return (
    <>
      {t.rich("consent", {
        link: (chunks) => (
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            {chunks}
          </Link>
        ),
      })}
    </>
  );
}
