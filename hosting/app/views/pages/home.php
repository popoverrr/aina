<?php
/** Главная страница. */
declare(strict_types=1);

$hero = hero_texts();
$stats = stats_values();
$hot = hot_properties(3);
$cases = featured_cases(3);
$reviews = public_testimonials();
$c = contacts();

page_head([
    'title' => null,
    'description' => t('home.meta.description'),
    'path' => '/',
    'jsonLd' => [array_filter([
        '@context' => 'https://schema.org',
        '@type' => 'RealEstateAgent',
        'name' => agent('fullName'),
        'description' => agent('tagline'),
        'url' => site_url(),
        'image' => abs_url('/agent/avatar.jpg'),
        'telephone' => $c['phone'],
        'email' => filled($c['email']) ? $c['email'] : null,
        'areaServed' => ['@type' => 'City', 'name' => agent('city')],
        'address' => ['@type' => 'PostalAddress', 'addressLocality' => agent('city'), 'addressCountry' => 'KZ'],
        'sameAs' => filled($c['instagram']) ? [instagram_link($c['instagram'])] : null,
    ], static fn($v) => $v !== null)],
]);
?>
<section class="border-b border-line bg-surface-2">
  <div class="container-site grid items-center gap-10 py-12 md:grid-cols-[1.15fr_1fr] md:py-16 lg:gap-16 lg:py-20">
    <div class="max-w-xl">
      <p class="mb-4 text-sm font-medium text-accent-ink"><?= e((string) agent('shortName')) ?> · <?= e((string) agent('role')) ?> · <?= e((string) agent('city')) ?></p>
      <h1><?= e($hero['title']) ?></h1>
      <p class="mt-5 text-lg text-ink-muted"><?= e($hero['subtitle']) ?></p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="/search" class="<?= e(btn('primary', 'lg')) ?>"><?= e(t('home.hero.primary')) ?></a>
        <a href="/objects" class="<?= e(btn('secondary', 'lg')) ?>"><?= e(t('home.hero.secondary')) ?></a>
      </div>
    </div>
    <div class="relative mx-auto w-full max-w-sm md:max-w-none">
      <div class="relative aspect-[3/4] overflow-hidden rounded-base bg-accent/10 shadow-card">
        <img src="/agent/hero.jpg" alt="<?= e(t('home.hero.photoAlt', ['name' => (string) agent('fullName')])) ?>" width="940" height="1254"
             fetchpriority="high" decoding="async" class="absolute inset-0 size-full object-cover"/>
      </div>
    </div>
  </div>
</section>

<section aria-label="<?= e(t('home.stats.aria')) ?>" class="border-b border-line">
  <dl class="container-site grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 lg:py-12">
    <?php foreach ($stats as $item): ?>
    <div class="min-w-0">
      <dd class="whitespace-nowrap text-[clamp(1.0625rem,4.8vw,1.875rem)] font-semibold tabular"><?= fill_in($item['value'], 'text-sm font-medium') ?></dd>
      <dt class="mt-1 text-sm text-ink-muted"><?= e($item['label']) ?></dt>
    </div>
    <?php endforeach ?>
  </dl>
</section>

<?php if ($hot): ?>
<?= section_open('default', '', ['aria-labelledby' => 'hot-title']) ?>
<?= section_header(t('home.hot.title'), t('home.hot.subtitle'), '<a href="/objects" class="' . e(btn('secondary', 'sm')) . '">' . e(t('common.actions.allObjects')) . ' →</a>', 'h2', 'hot-title') ?>
<?php property_grid($hot) ?>
<?= section_close() ?>
<?php endif ?>

<?php if ($cases): ?>
<?= section_open($hot ? 'muted' : 'default', '', ['aria-labelledby' => 'cases-title']) ?>
<?= section_header(t('home.cases.title'), t('home.cases.subtitle'), '<a href="/cases" class="' . e(btn('secondary', 'sm')) . '">' . e(t('common.actions.allCases')) . ' →</a>', 'h2', 'cases-title') ?>
<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <?php foreach ($cases as $item): ?><li><?php case_card($item, false) ?></li><?php endforeach ?>
</ul>
<?= section_close() ?>
<?php endif ?>

<?= section_open('muted', '', ['aria-labelledby' => 'locations-title']) ?>
<div class="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
  <div>
    <h2 id="locations-title"><?= e(t('home.locations.title')) ?></h2>
    <p class="mt-4 text-lg"><?= e(t('home.locations.lead')) ?></p>
    <div class="mt-4 text-ink-muted"><?= fill_in_text(locations_text()) ?></div>
  </div>
  <figure class="mx-auto w-full max-w-md lg:max-w-none">
    <svg viewBox="0 0 480 400" role="img" aria-label="<?= e(t('home.locations.mapAria')) ?>" class="h-auto w-full">
      <rect width="480" height="400" fill="var(--color-surface)" rx="8"/>
      <g stroke="var(--color-line)" stroke-width="2">
        <?php foreach ([60, 120, 180, 240, 300, 360, 420] as $x): ?><line x1="<?= $x ?>" y1="20" x2="<?= $x ?>" y2="340"/><?php endforeach ?>
        <?php foreach ([60, 110, 160, 210, 260, 310] as $y): ?><line x1="20" y1="<?= $y ?>" x2="460" y2="<?= $y ?>"/><?php endforeach ?>
      </g>
      <g stroke="var(--color-ink-muted)" stroke-width="3" stroke-linecap="round">
        <line x1="20" y1="310" x2="460" y2="310"/>
        <line x1="20" y1="60" x2="460" y2="60"/>
        <line x1="120" y1="20" x2="120" y2="340"/>
        <line x1="360" y1="20" x2="360" y2="340"/>
      </g>
      <rect x="120" y="60" width="240" height="250" fill="var(--color-accent)" fill-opacity="0.14" stroke="var(--color-accent)" stroke-width="3" rx="4"/>
      <text x="240" y="190" text-anchor="middle" font-size="18" font-weight="600" fill="var(--color-accent-ink)"><?= e(t('home.locations.mapLabel')) ?></text>
      <text x="240" y="50" text-anchor="middle" font-size="12" fill="var(--color-ink-muted)">север · центр города</text>
      <g fill="var(--color-line)">
        <polygon points="40,392 100,352 160,392"/>
        <polygon points="140,392 220,342 300,392"/>
        <polygon points="280,392 340,356 400,392"/>
        <polygon points="380,392 430,362 470,392"/>
      </g>
      <text x="240" y="384" text-anchor="middle" font-size="11" fill="var(--color-ink-muted)">юг · горы</text>
    </svg>
    <figcaption class="mt-2 text-xs text-ink-muted"><?= e(t('home.locations.mapCaption')) ?></figcaption>
  </figure>
</div>
<?= section_close() ?>

<?= section_open('default', '', ['aria-labelledby' => 'how-title']) ?>
<?= section_header(t('home.how.title'), null, null, 'h2', 'how-title') ?>
<ol class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
  <?php foreach ([['1', 'clipboard-list'], ['2', 'calculator'], ['3', 'handshake'], ['4', 'file-check']] as $i => [$key, $ico]): ?>
  <li class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <span class="text-accent"><?= icon($ico, 'size-6') ?></span>
      <span class="text-sm font-medium text-ink-muted tabular">0<?= $i + 1 ?></span>
    </div>
    <h3><?= e(t("home.how.steps.$key.title")) ?></h3>
    <p class="text-sm text-ink-muted"><?= e(t("home.how.steps.$key.text")) ?></p>
  </li>
  <?php endforeach ?>
</ol>
<?= section_close() ?>

<?= section_open('muted', '', ['aria-labelledby' => 'who-title']) ?>
<?= section_header(t('home.who.title'), null, null, 'h2', 'who-title') ?>
<ul class="grid gap-6 md:grid-cols-3">
  <?php foreach ([['investor', '/objects', 'trending-up'], ['tenant', '/search', 'store'], ['owner', '/owners', 'key-round']] as [$key, $href, $ico]): ?>
  <li>
    <a href="<?= e($href) ?>" class="group flex h-full flex-col gap-4 rounded-base border border-line bg-surface p-6 shadow-card transition-[border-color] hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      <span class="text-accent"><?= icon($ico, 'size-6') ?></span>
      <h3><?= e(t("home.who.$key.title")) ?></h3>
      <p class="text-sm text-ink-muted"><?= e(t("home.who.$key.pain")) ?></p>
      <span class="mt-auto inline-flex items-center gap-1 text-sm font-medium text-accent-ink group-hover:underline"><?= e(t("home.who.$key.cta")) ?><?= icon('arrow-right') ?></span>
    </a>
  </li>
  <?php endforeach ?>
</ul>
<?= section_close() ?>

<?php testimonials_section($reviews, t('home.testimonials.title')) ?>

<?= section_open('default', '', ['aria-labelledby' => 'home-form-title']) ?>
<div class="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
  <div>
    <h2 id="home-form-title"><?= e(t('home.form.title')) ?></h2>
    <p class="mt-3 text-ink-muted"><?= e(t('home.form.text')) ?></p>
  </div>
  <div><?php lead_form(['type' => 'CONTACT', 'compact' => true, 'note' => t('home.form.note'), 'idPrefix' => 'home', 'back' => '/']) ?></div>
</div>
<?= section_close() ?>
<?php
page_foot();
