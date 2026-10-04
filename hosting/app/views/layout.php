<?php
/**
 * Каркас публичных страниц: head, шапка, подвал, плавающая кнопка WhatsApp.
 * page_head([...]) печатает всё до <main>, page_foot() — всё после.
 */
declare(strict_types=1);

/**
 * $o: title, description, path, ogImage, noindex, jsonLd (массив массивов), bodyAttrs
 */
function page_head(array $o = []): void
{
    $c = contacts();
    $name = (string) agent('shortName');
    $title = filled($o['title'] ?? null)
        ? t('seo.titleTemplate', ['title' => $o['title'], 'name' => $name])
        : t('seo.defaultTitle', ['name' => $name]);
    $description = filled($o['description'] ?? null) ? (string) $o['description'] : t('seo.defaultDescription');
    $path = (string) ($o['path'] ?? '/');
    $ogImage = abs_url((string) ($o['ogImage'] ?? '/og-default.jpg'));
    ?>
<!doctype html>
<html lang="ru" class="h-full antialiased">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title><?= e($title) ?></title>
<meta name="description" content="<?= e($description) ?>"/>
<link rel="canonical" href="<?= e(abs_url($path)) ?>"/>
<?php if (!empty($o['noindex'])): ?>
<meta name="robots" content="noindex, nofollow"/>
<?php endif ?>
<meta property="og:type" content="website"/>
<meta property="og:locale" content="ru_KZ"/>
<meta property="og:site_name" content="<?= e($name) ?>"/>
<meta property="og:title" content="<?= e($title) ?>"/>
<meta property="og:description" content="<?= e($description) ?>"/>
<meta property="og:url" content="<?= e(abs_url($path)) ?>"/>
<meta property="og:image" content="<?= e($ogImage) ?>"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="<?= e($title) ?>"/>
<meta name="twitter:description" content="<?= e($description) ?>"/>
<meta name="twitter:image" content="<?= e($ogImage) ?>"/>
<link rel="icon" href="/agent/avatar-160.jpg"/>
<link rel="apple-touch-icon" href="/agent/avatar-160.jpg"/>
<link rel="preload" href="/assets/fonts/inter-400-cyrillic.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="stylesheet" href="/assets/site.css?v=<?= e(asset_version()) ?>"/>
<?php
    foreach ($o['jsonLd'] ?? [] as $data) {
        echo json_ld($data), "\n";
    }
    ?>
</head>
<body class="flex min-h-full flex-col"<?= isset($o['bodyAttrs']) ? ' ' . $o['bodyAttrs'] : '' ?>>
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-base focus:bg-surface focus:px-4 focus:py-2 focus:shadow-modal"><?= e(t('common.skipToContent')) ?></a>
<?php site_header($c) ?>
<main id="main" class="flex-1">
<?php
}

function page_foot(): void
{
    $c = contacts();
    site_footer($c);
    ?>
<a href="<?= e(whatsapp_url(t('common.whatsappPreset'))) ?>" target="_blank" rel="noopener noreferrer" aria-label="<?= e(t('common.actions.whatsappFloat')) ?>"
   class="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-success text-white shadow-card transition-[bottom,transform,filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success active:scale-95 [body[data-sticky]_&]:bottom-24 md:right-6 md:bottom-6 md:[body[data-sticky]_&]:bottom-6">
<?= icon('message-circle', 'size-7') ?>
</a>
<script src="/assets/site.js?v=<?= e(asset_version()) ?>" defer></script>
<?php analytics_scripts() ?>
</body>
</html>
<?php
    echo "\n";
}

/** Метка версии файлов стилей и скриптов — чтобы браузер забирал обновления после выкладки. */
function asset_version(): string
{
    static $v = null;
    if ($v === null) {
        $file = ROOT_DIR . '/assets/site.css';
        $v = is_file($file) ? (string) filemtime($file) : '1';
    }
    return $v;
}

function nav_items(): array
{
    return [
        ['/objects', t('common.nav.objects')],
        ['/cases', t('common.nav.cases')],
        ['/about', t('common.nav.about')],
        ['/owners', t('common.nav.owners')],
        ['/contacts', t('common.nav.contacts')],
    ];
}

function site_header(array $c): void
{
    $phone = fmt_phone($c['phone']);
    $wa = whatsapp_url(t('common.whatsappPreset'));
    $mobile = array_merge([['/', t('common.nav.home')]], nav_items(), [['/search', t('common.nav.search')]]);
    $current = current_path();
    ?>
<header class="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
<div class="container-site flex h-16 items-center justify-between gap-4">
  <a href="/" class="flex items-center gap-3 rounded-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
    <img src="/agent/avatar-160.jpg" alt="" width="40" height="40" class="size-10 rounded-full object-cover"/>
    <span class="flex flex-col leading-tight">
      <span class="font-semibold tracking-tight"><?= e((string) agent('shortName')) ?></span>
      <span class="text-xs text-ink-muted"><?= e(t('common.brandRole')) ?></span>
    </span>
  </a>

  <nav class="hidden md:block" aria-label="<?= e(t('common.nav.home')) ?>">
    <ul class="flex items-center gap-1">
      <?php foreach (nav_items() as [$href, $label]): ?>
      <li><a href="<?= e($href) ?>" class="rounded-base px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"<?= $current === $href ? ' aria-current="page"' : '' ?>><?= e($label) ?></a></li>
      <?php endforeach ?>
    </ul>
  </nav>

  <div class="hidden items-center gap-2 md:flex">
    <a href="<?= e(phone_href($c['phone'])) ?>" class="<?= e(btn('ghost', 'sm', 'tabular')) ?>"><?= icon('phone') ?><?= e($phone) ?></a>
    <a href="<?= e($wa) ?>" target="_blank" rel="noopener noreferrer" class="<?= e(btn('whatsapp', 'sm')) ?>"><?= icon('message-circle') ?><?= e(t('common.actions.whatsapp')) ?></a>
  </div>

  <div class="md:hidden">
    <button type="button" data-menu-open aria-label="<?= e(t('common.actions.menu')) ?>" aria-haspopup="dialog" aria-expanded="false"
      class="flex size-11 items-center justify-center rounded-base text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><?= icon('menu', 'size-6') ?></button>
    <dialog data-menu aria-label="<?= e((string) agent('shortName')) ?>" class="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-ink backdrop:bg-transparent">
      <div class="flex h-full flex-col">
        <div class="container-site flex h-16 items-center justify-between border-b border-line">
          <span class="font-semibold"><?= e((string) agent('shortName')) ?></span>
          <button type="button" data-menu-close aria-label="<?= e(t('common.actions.closeMenu')) ?>"
            class="flex size-11 items-center justify-center rounded-base hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><?= icon('x', 'size-6') ?></button>
        </div>
        <nav class="container-site flex-1 overflow-y-auto py-6" aria-label="<?= e((string) agent('shortName')) ?>">
          <ul class="flex flex-col">
            <?php foreach ($mobile as [$href, $label]): ?>
            <li><a href="<?= e($href) ?>" class="block rounded-base py-3.5 text-2xl font-medium hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"<?= $current === $href ? ' aria-current="page"' : '' ?>><?= e($label) ?></a></li>
            <?php endforeach ?>
          </ul>
        </nav>
        <div class="container-site flex flex-col gap-3 border-t border-line py-5">
          <a href="<?= e(phone_href($c['phone'])) ?>" class="<?= e(btn('secondary', 'lg', 'w-full')) ?>"><?= icon('phone', 'size-5') ?><?= e($phone) ?></a>
          <a href="<?= e($wa) ?>" target="_blank" rel="noopener noreferrer" class="<?= e(btn('whatsapp', 'lg', 'w-full')) ?>"><?= icon('message-circle', 'size-5') ?><?= e(t('common.actions.whatsappWrite')) ?></a>
        </div>
      </div>
    </dialog>
  </div>
</div>
</header>
<?php
}

function site_footer(array $c): void
{
    $linkClass = 'hover:text-ink hover:underline underline-offset-4 rounded-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
    $nav = array_merge(nav_items(), [['/search', t('common.nav.search')], ['/privacy', t('common.nav.privacy')]]);
    // Подбор в подвале стоит перед контактами, как в основной версии.
    usort($nav, static fn(array $a, array $b) => array_search($a[0], ['/objects', '/cases', '/about', '/owners', '/search', '/contacts', '/privacy'], true)
        <=> array_search($b[0], ['/objects', '/cases', '/about', '/owners', '/search', '/contacts', '/privacy'], true));
    ?>
<footer class="border-t border-line bg-surface-2">
<div class="container-site grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr] lg:py-16">
  <div>
    <p class="text-lg font-semibold"><?= e((string) agent('fullName')) ?></p>
    <p class="mt-1 text-sm text-ink-muted"><?= e(t('common.brandRole')) ?> · <?= e((string) agent('city')) ?></p>
    <p class="mt-3 max-w-sm text-sm text-ink-muted"><?= e((string) agent('tagline')) ?></p>
  </div>

  <nav aria-label="<?= e(t('common.footer.navTitle')) ?>">
    <p class="mb-3 text-sm font-semibold"><?= e(t('common.footer.navTitle')) ?></p>
    <ul class="space-y-2 text-sm text-ink-muted">
      <?php foreach ($nav as [$href, $label]): ?>
      <li><a href="<?= e($href) ?>" class="<?= e($linkClass) ?>"><?= e($label) ?></a></li>
      <?php endforeach ?>
    </ul>
  </nav>

  <div>
    <p class="mb-3 text-sm font-semibold"><?= e(t('common.footer.contactsTitle')) ?></p>
    <ul class="space-y-2 text-sm text-ink-muted">
      <li><a href="<?= e(phone_href($c['phone'])) ?>" class="<?= e($linkClass) ?> tabular"><?= e(fmt_phone($c['phone'])) ?></a></li>
      <li><a href="<?= e(whatsapp_url()) ?>" target="_blank" rel="noopener noreferrer" class="<?= e($linkClass) ?>"><?= e(t('common.actions.whatsapp')) ?></a></li>
      <?php if (filled($c['telegram'])): ?>
      <li><a href="<?= e(telegram_link($c['telegram'])) ?>" target="_blank" rel="noopener noreferrer" class="<?= e($linkClass) ?>"><?= e(t('common.actions.telegram')) ?></a></li>
      <?php endif ?>
      <?php if (filled($c['instagram'])): ?>
      <li><a href="<?= e(instagram_link($c['instagram'])) ?>" target="_blank" rel="noopener noreferrer" class="<?= e($linkClass) ?>"><?= e(t('common.footer.instagramNote', ['handle' => $c['instagram']])) ?></a></li>
      <?php endif ?>
      <?php if (filled($c['email'])): ?>
      <li><a href="mailto:<?= e($c['email']) ?>" class="<?= e($linkClass) ?>"><?= e($c['email']) ?></a></li>
      <?php endif ?>
    </ul>
    <?php if (filled(legal('entity'))): ?>
    <p class="mt-6 mb-1 text-sm font-semibold"><?= e(t('common.footer.legalTitle')) ?></p>
    <p class="text-sm text-ink-muted"><?= e((string) legal('entity')) ?></p>
    <?php endif ?>
  </div>
</div>
<div class="border-t border-line">
  <div class="container-site py-4 text-xs text-ink-muted"><?= e(t('common.footer.rights', ['year' => date('Y'), 'name' => (string) agent('fullName')])) ?></div>
</div>
<?php /* Подпись разработчика: имя компании, поэтому не переводится и не лежит в словаре. */ ?>
<div class="border-t border-line">
  <div class="container-site flex justify-center py-4 pb-24 sm:justify-end">
    <a href="<?= e(made_by('url')) ?>" target="_blank" rel="noopener"
       class="group inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent px-[18px] py-2.5 text-sm transition-colors duration-150 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      <span class="text-ink-muted transition-colors duration-150 group-hover:text-white">Created by</span>
      <span class="font-semibold text-accent-ink transition-colors duration-150 group-hover:text-white"><?= e(made_by('label')) ?></span>
      <?= icon('arrow-up-right', 'size-4 text-accent-ink transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white') ?>
    </a>
  </div>
</div>
</footer>
<?php
}

function current_path(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    return $path === '/' ? '/' : rtrim($path, '/');
}

/** Счётчики подключаются только если их идентификаторы заданы в настройках. */
function analytics_scripts(): void
{
    $ga4 = (string) cfg('ga4_id', '');
    $metrika = (string) cfg('metrika_id', '');
    if ($ga4 !== ''): ?>
<script async src="https://www.googletagmanager.com/gtag/js?id=<?= e($ga4) ?>"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','<?= e($ga4) ?>',{send_page_view:true});</script>
<?php endif;
    if ($metrika !== '' && ctype_digit($metrika)): ?>
<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(<?= (int) $metrika ?>,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});</script>
<?php endif;
}
