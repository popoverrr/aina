<?php
/**
 * Карточка объекта.
 * Для закрытого объекта адрес, полная цена, презентация и фото интерьера не попадают
 * в разметку вообще, пока не отправлена заявка по этому объекту (см. public_property).
 */
declare(strict_types=1);

/** @var array $property подготовлено роутером */
$p = $property;
$kind = kind_label($p['kind']);
$area = $p['areaM2'] !== null ? fmt_area($p['areaM2']) : $p['areaLabel'];
$locked = $p['isExclusive'] && !$p['unlocked'];
$similar = similar_properties($p['kind'], $p['id'], 3);
$price = $p['priceRentTotal'] ?? $p['priceSale'];
$dealShort = deal_short($p['dealType']);
$priceText = $p['priceRentTotal'] !== null ? fmt_price($p['priceRentTotal']) : ($p['priceSale'] !== null ? fmt_price($p['priceSale']) : '');

$ld = [
    '@context' => 'https://schema.org',
    '@type' => 'Product',
    'name' => $p['title'],
    'description' => $kind . ', ' . $p['district'] . ', ' . $area,
    'url' => abs_url('/objects/' . $p['slug']),
    'category' => $kind,
];
if ($p['cover']) {
    $ld['image'] = str_starts_with($p['cover']['url'], 'http') ? $p['cover']['url'] : abs_url($p['cover']['url']);
}
if ($price !== null && !$locked) {
    $ld['offers'] = [
        '@type' => 'Offer',
        'price' => $price,
        'priceCurrency' => 'KZT',
        'availability' => $p['status'] === 'RESERVED' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
        'url' => abs_url('/objects/' . $p['slug']),
    ];
}

page_head([
    'title' => t('objects.meta.detailTitle', ['kind' => $kind, 'area' => $area, 'district' => $p['district'], 'deal' => $dealShort]),
    'description' => $p['isExclusive']
        ? t('objects.meta.detailDescriptionExclusive', ['kind' => $kind, 'area' => $area, 'district' => $p['district']])
        : t('objects.meta.detailDescription', ['kind' => $kind, 'area' => $area, 'district' => $p['district'], 'deal' => $dealShort, 'price' => $priceText]),
    'path' => '/objects/' . $p['slug'],
    'ogImage' => $p['cover'] ? $p['cover']['url'] : '/og-default.jpg',
    'jsonLd' => [$ld],
    'bodyAttrs' => 'data-sticky="1"',
]);

echo breadcrumbs([['label' => t('common.nav.objects'), 'href' => '/objects'], ['label' => $p['title']]]);
?>
<article class="section-y pt-6 pb-28 md:pb-24 lg:pt-8">
  <div class="container-site">
    <header class="mb-6 max-w-3xl">
      <div class="mb-3 flex flex-wrap gap-1.5">
        <?php if ($p['isHot']) echo badge_tone(t('common.badges.hot'), 'hot') ?>
        <?php if ($p['isExclusive']) echo badge_tone(t('objects.detail.exclusive.badge'), 'accent') ?>
        <?php if ($p['status'] === 'RESERVED') echo badge_tone(t('common.badges.reserved'), 'neutral') ?>
      </div>
      <h1><?= e($p['title']) ?></h1>
      <p class="mt-2 text-ink-muted"><?= e($kind) ?> · <?= e($p['district']) ?> · <?= e($area) ?></p>
    </header>

    <div class="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
      <div class="space-y-10">
        <?php gallery($p['images'], $p['title'], $locked) ?>

        <section aria-labelledby="params-title">
          <h2 id="params-title" class="mb-4 text-xl"><?= e(t('objects.detail.params')) ?></h2>
          <?php params_table($p) ?>
        </section>

        <?php if (filled($p['descriptionMd'])): ?>
        <section aria-labelledby="desc-title">
          <h2 id="desc-title" class="mb-4 text-xl"><?= e(t('objects.detail.description')) ?></h2>
          <div class="prose-site text-ink"><?= render_markdown($p['descriptionMd']) ?></div>
        </section>
        <?php endif ?>

        <?php if ($p['advantages']): ?>
        <section aria-labelledby="adv-title">
          <h2 id="adv-title" class="mb-4 text-xl"><?= e(t('objects.detail.advantages')) ?></h2>
          <ul class="grid gap-2 sm:grid-cols-2">
            <?php foreach ($p['advantages'] as $a): ?>
            <li class="flex gap-2"><span class="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true"></span><span><?= e((string) $a) ?></span></li>
            <?php endforeach ?>
          </ul>
        </section>
        <?php endif ?>

        <div class="flex gap-4 rounded-base border border-dashed border-line bg-surface-2 p-5">
          <span class="shrink-0 text-accent"><?= icon('calculator', 'size-6') ?></span>
          <div>
            <h2 class="text-base font-semibold"><?= e(t('objects.detail.calculator.title')) ?></h2>
            <p class="mt-1 text-sm text-ink-muted"><?= e(t('objects.detail.calculator.text')) ?></p>
          </div>
        </div>
      </div>

      <aside class="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <div class="rounded-base border border-line bg-surface p-5 shadow-card">
          <?= property_price($p, 'lg') ?>
          <?php if ($locked): ?><p class="mt-2 text-sm text-ink-muted"><?= e(t('objects.detail.exclusive.panelText')) ?></p><?php endif ?>
        </div>

        <section id="request" aria-labelledby="request-title" class="scroll-mt-24 rounded-base border border-line bg-surface p-5 shadow-card">
          <?php if ($p['isExclusive'] && $p['unlocked']): ?>
          <h2 id="request-title" class="text-xl"><?= e(t('objects.detail.request.unlockedTitle')) ?></h2>
          <p class="mt-2 text-sm text-ink-muted"><?= e(t('objects.detail.request.unlockedText')) ?></p>
          <?php if (filled($p['presentationUrl'])): ?>
          <a href="<?= e($p['presentationUrl']) ?>" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-2 font-medium text-accent-ink underline underline-offset-4">
            <?= icon('download') ?><?= e(t('objects.detail.request.download')) ?>
          </a>
          <?php endif ?>
          <?php else: ?>
          <h2 id="request-title" class="text-xl"><?= e(t('objects.detail.request.title')) ?></h2>
          <p class="mt-2 mb-5 text-sm text-ink-muted"><?= e(t('objects.detail.request.text')) ?></p>
          <?php lead_form([
              'type' => 'PRESENTATION',
              'propertyId' => $p['id'],
              'submitLabel' => t('objects.detail.request.button'),
              'idPrefix' => 'request',
              'back' => '/objects/' . $p['slug'],
          ]) ?>
          <?php endif ?>
        </section>
      </aside>
    </div>

    <?php if ($similar): ?>
    <section aria-labelledby="similar-title" class="mt-16 lg:mt-24">
      <h2 id="similar-title" class="mb-6"><?= e(t('objects.detail.similar')) ?></h2>
      <?php property_grid($similar) ?>
    </section>
    <?php endif ?>
  </div>
</article>

<div class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/90 md:hidden">
  <div class="flex items-center justify-between gap-3">
    <div class="min-w-0"><?= property_price($p, 'sm') ?></div>
    <a href="#request" class="<?= e(btn('primary', 'md', 'shrink-0')) ?>"><?= e(t('objects.detail.sticky.request')) ?></a>
  </div>
</div>
<?php
page_foot();

/** Галерея: стрелки, миниатюры, полный экран. Без JavaScript видно первое фото. */
function gallery(array $images, string $title, bool $locked): void
{
    $total = count($images);
    $first = $images[0] ?? null;
    ?>
<div data-gallery>
  <section aria-label="<?= e(t('objects.detail.gallery.aria')) ?>" aria-roledescription="carousel" tabindex="0"
           class="relative aspect-[4/3] w-full overflow-hidden rounded-base bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
    <?php if ($first): ?>
    <?php foreach ($images as $i => $img): ?>
    <img src="<?= e($img['url']) ?>" alt="<?= e(filled($img['alt']) ? $img['alt'] : $title) ?>" data-slide="<?= $i ?>"
         <?= $i === 0 ? 'fetchpriority="high"' : 'loading="lazy"' ?> decoding="async"
         class="absolute inset-0 size-full object-cover<?= $i === 0 ? '' : ' hidden' ?>"/>
    <?php endforeach ?>
    <?php else: ?>
    <?= image_placeholder(t('common.placeholders.photo')) ?>
    <?php endif ?>

    <?php if ($total > 1): ?>
    <button type="button" data-gallery-prev aria-label="<?= e(t('objects.detail.gallery.prev')) ?>"
      class="absolute top-1/2 left-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-card transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><?= icon('chevron-left', 'size-5') ?></button>
    <button type="button" data-gallery-next aria-label="<?= e(t('objects.detail.gallery.next')) ?>"
      class="absolute top-1/2 right-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-card transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><?= icon('chevron-right', 'size-5') ?></button>
    <p class="absolute bottom-3 left-3 z-10 rounded-base bg-ink/70 px-2 py-1 text-xs text-white tabular" aria-live="polite" data-gallery-counter><?= e(t('objects.detail.gallery.counter', ['current' => 1, 'total' => $total])) ?></p>
    <?php endif ?>

    <?php if ($locked): ?>
    <div class="absolute inset-x-0 bottom-0 z-10">
      <div class="bg-ink/85 p-4 text-white backdrop-blur-sm sm:p-5">
        <div class="flex items-start gap-3">
          <span class="mt-0.5 shrink-0"><?= icon('lock', 'size-5') ?></span>
          <div class="min-w-0 flex-1">
            <p class="font-semibold"><?= e(t('objects.detail.exclusive.panelTitle')) ?></p>
            <p class="mt-1 text-sm text-white/80"><?= e(t('objects.detail.exclusive.panelText')) ?></p>
            <a href="#request" class="<?= e(btn('primary', 'sm', 'mt-3')) ?>"><?= e(t('objects.detail.request.button')) ?></a>
          </div>
        </div>
      </div>
    </div>
    <?php endif ?>
  </section>

  <?php if ($total > 1): ?>
  <ul class="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="<?= e(t('objects.detail.gallery.aria')) ?>">
    <?php foreach ($images as $i => $img): ?>
    <li class="shrink-0">
      <button type="button" data-gallery-thumb="<?= $i ?>" aria-label="<?= e(t('objects.detail.gallery.thumb', ['n' => $i + 1])) ?>"<?= $i === 0 ? ' aria-current="true"' : '' ?>
        class="relative block h-16 w-22 overflow-hidden rounded-base border-2 <?= $i === 0 ? 'border-accent' : 'border-transparent hover:border-line' ?> transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <img src="<?= e($img['url']) ?>" alt="" loading="lazy" decoding="async" class="absolute inset-0 size-full object-cover"/>
      </button>
    </li>
    <?php endforeach ?>
  </ul>
  <?php endif ?>
</div>
<?php
}

/** Параметры таблицей. Пустые поля не выводятся. */
function params_table(array $p): void
{
    $rows = [
        [t('objects.detail.table.kind'), kind_label($p['kind'])],
        [t('objects.detail.table.deal'), deal_label($p['dealType'])],
        [t('objects.detail.table.district'), $p['district']],
    ];
    if (filled($p['address'])) {
        $rows[] = [t('objects.detail.table.address'), $p['address']];
    }
    if (filled($p['landmark'])) {
        $rows[] = [t('objects.detail.table.landmark'), $p['landmark']];
    }
    $rows[] = [t('objects.detail.table.area'), $p['areaM2'] !== null ? fmt_area($p['areaM2']) : $p['areaLabel']];
    if ($p['ceilingM'] !== null) {
        $rows[] = [t('objects.detail.table.ceiling'), t('objects.detail.table.meters', ['value' => fmt_number($p['ceilingM'], 1)])];
    }
    if (filled($p['floor'])) {
        $rows[] = [t('objects.detail.table.floor'), $p['floor']];
    }
    if (filled($p['entrance'])) {
        $rows[] = [t('objects.detail.table.entrance'), $p['entrance']];
    }
    if ($p['powerKw'] !== null) {
        $rows[] = [t('objects.detail.table.power'), t('objects.detail.table.kw', ['value' => fmt_number($p['powerKw'])])];
    }
    $rows[] = [t('objects.detail.table.wetPoint'), $p['hasWetPoint'] ? t('common.yes') : t('common.no')];

    if ($p['isExclusive'] && !$p['unlocked']) {
        $rows[] = [$p['dealType'] === 'SALE' ? t('objects.detail.table.priceSale') : t('objects.detail.table.priceRent'), t('objects.detail.exclusive.priceOnRequest')];
    } else {
        if ($p['priceSale'] !== null) {
            $rows[] = [t('objects.detail.table.priceSale'), fmt_price($p['priceSale'])];
        }
        if ($p['priceRentTotal'] !== null) {
            $rows[] = [t('objects.detail.table.priceRent'), fmt_price($p['priceRentTotal'])];
        }
        if ($p['priceRentM2'] !== null) {
            $rows[] = [t('objects.detail.table.priceRentM2'), fmt_price_m2($p['priceRentM2'])];
        }
        if ($p['dealType'] !== 'SALE') {
            $rows[] = [t('objects.detail.table.utilities'), $p['utilitiesIncluded'] ? t('objects.detail.table.utilitiesIncluded') : t('objects.detail.table.utilitiesExcluded')];
        }
    }
    ?>
<div class="overflow-x-auto">
  <table class="w-full text-sm"><tbody>
    <?php foreach ($rows as [$label, $value]): ?>
    <tr class="border-b border-line last:border-b-0">
      <th scope="row" class="w-1/2 py-2.5 pr-4 text-left font-normal text-ink-muted"><?= e($label) ?></th>
      <td class="py-2.5 font-medium tabular"><?= e((string) $value) ?></td>
    </tr>
    <?php endforeach ?>
  </tbody></table>
</div>
<?php
}
