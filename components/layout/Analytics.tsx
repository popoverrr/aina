import Script from "next/script";
import { site } from "@/site.config";

/**
 * Счётчики аналитики: только через next/script afterInteractive, ничего в <head>.
 * Без переменных окружения ничего не рендерится.
 */
export function Analytics() {
  const ga4 = site.analytics.ga4;
  const metrika = site.analytics.metrika;
  if (!ga4 && !metrika) return null;

  return (
    <>
      {ga4 ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga4}',{send_page_view:true});`}
          </Script>
        </>
      ) : null}
      {metrika ? (
        <Script id="metrika-init" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${Number(metrika)},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});`}
        </Script>
      ) : null}
    </>
  );
}
