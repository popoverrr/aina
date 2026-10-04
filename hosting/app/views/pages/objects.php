<?php
/**
 * Каталог объектов. Фильтры — обычная GET-форма: ссылкой с параметрами можно поделиться,
 * выборка воспроизводится, а без JavaScript работает кнопка «Показать».
 */
declare(strict_types=1);

$filters = parse_filters($_GET);
$result = search_properties($filters);
$items = $result['items'];
$total = $result['total'];
$active = filters_are_active($filters);

$kinds = [];
foreach (prop_kinds() as $k) {
    $kinds[$k] = kind_label($k);
}
$sorts = [
    'hot' => t('objects.filters.sortHot'),
    'price_asc' => t('objects.filters.sortPriceAsc'),
    'price_desc' => t('objects.filters.sortPriceDesc'),
    'area_desc' => t('objects.filters.sortAreaDesc'),
    'date' => t('objects.filters.sortDate'),
];
$countLabel = objects_count_label($total);

page_head([
    'title' => t('objects.meta.title'),
    'description' => t('objects.meta.description'),
    'path' => '/objects',
    // Комбинации фильтров не индексируем: в поиске должна быть одна страница каталога.
    'noindex' => $active,
]);

echo breadcrumbs([['label' => t('common.nav.objects')]]);
?>
<section class="section-y pt-6 lg:pt-8">
  <div class="container-site">
    <div class="mb-8 max-w-2xl">
      <h1><?= e(t('objects.title')) ?></h1>
      <p class="mt-3 text-ink-muted"><?= e(t('objects.intro')) ?></p>
    </div>

    <div class="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside class="lg:sticky lg:top-20 lg:self-start" aria-label="<?= e(t('objects.filters.title')) ?>">
        <div class="mb-3 flex items-center justify-between lg:hidden">
          <button type="button" class="<?= e(btn('secondary', 'sm')) ?>" data-filters-toggle aria-expanded="false" aria-controls="catalog-filters">
            <?= icon('chevron-down') ?><span data-filters-label><?= e(t('objects.filters.open')) ?></span>
          </button>
          <span class="text-sm text-ink-muted tabular"><?= e($countLabel) ?></span>
        </div>

        <form id="catalog-filters" method="get" action="/objects" class="hidden space-y-5 rounded-base border border-line bg-surface p-4 lg:block" data-filters>
          <?= field_select('f-deal', 'deal', t('objects.filters.deal'), ['RENT' => deal_label('RENT'), 'SALE' => deal_label('SALE')], ['placeholder' => t('objects.filters.dealAny'), 'value' => (string) ($filters['deal'] ?? '')]) ?>
          <?= field_select('f-kind', 'kind', t('objects.filters.kind'), $kinds, ['placeholder' => t('objects.filters.kindAny'), 'value' => (string) ($filters['kind'] ?? '')]) ?>

          <fieldset>
            <legend class="mb-2 text-sm font-medium"><?= e(t('objects.filters.district')) ?></legend>
            <div class="grid grid-cols-2 gap-2 lg:grid-cols-1">
              <?php foreach (districts() as $slug => $name): ?>
              <?= field_checkbox('f-d-' . $slug, 'district[]', $name, ['value' => $slug, 'checked' => in_array($slug, $filters['districts'], true)]) ?>
              <?php endforeach ?>
            </div>
          </fieldset>

          <fieldset>
            <legend class="mb-2 text-sm font-medium"><?= e(t('objects.filters.area')) ?></legend>
            <div class="grid grid-cols-2 gap-2">
              <?= field_input('f-area-from', 'areaFrom', t('objects.filters.from'), ['type' => 'number', 'inputmode' => 'decimal', 'min' => 0, 'value' => $filters['areaFrom'] === null ? '' : (string) $filters['areaFrom']]) ?>
              <?= field_input('f-area-to', 'areaTo', t('objects.filters.to'), ['type' => 'number', 'inputmode' => 'decimal', 'min' => 0, 'value' => $filters['areaTo'] === null ? '' : (string) $filters['areaTo']]) ?>
            </div>
          </fieldset>

          <fieldset>
            <legend class="mb-1 text-sm font-medium"><?= e(t('objects.filters.budget')) ?></legend>
            <p class="mb-2 text-xs text-ink-muted"><?= e(t('objects.filters.budgetHint')) ?></p>
            <div class="grid grid-cols-2 gap-2">
              <?= field_input('f-price-from', 'priceFrom', t('objects.filters.from'), ['type' => 'number', 'inputmode' => 'numeric', 'min' => 0, 'value' => $filters['priceFrom'] === null ? '' : (string) $filters['priceFrom']]) ?>
              <?= field_input('f-price-to', 'priceTo', t('objects.filters.to'), ['type' => 'number', 'inputmode' => 'numeric', 'min' => 0, 'value' => $filters['priceTo'] === null ? '' : (string) $filters['priceTo']]) ?>
            </div>
          </fieldset>

          <div class="space-y-2">
            <?= field_checkbox('f-hot', 'hot', t('objects.filters.onlyHot'), ['value' => '1', 'checked' => $filters['hot']]) ?>
            <?= field_checkbox('f-first-line', 'firstLine', t('objects.filters.firstLine'), ['value' => '1', 'checked' => $filters['firstLine']]) ?>
          </div>

          <?= field_select('f-sort', 'sort', t('objects.filters.sort'), $sorts, ['value' => $filters['sort']]) ?>

          <button type="submit" class="<?= e(btn('primary', 'sm', 'w-full')) ?>"><?= e(t('objects.filters.apply')) ?></button>
          <a href="/objects" class="<?= e(btn('ghost', 'sm', 'w-full')) ?>"><?= icon('x') ?><?= e(t('objects.filters.reset')) ?></a>
        </form>
      </aside>

      <div>
        <p class="mb-4 hidden text-sm text-ink-muted tabular lg:block" aria-live="polite"><?= e($countLabel) ?></p>
        <?php if (!$items): ?>
        <div class="rounded-base border border-dashed border-line bg-surface-2 p-8 text-center">
          <p class="text-ink-muted"><?= e(t('objects.empty.text')) ?></p>
          <a href="/search" class="<?= e(btn('primary', 'md', 'mt-5')) ?>"><?= e(t('objects.empty.cta')) ?></a>
        </div>
        <?php else: ?>
        <?php property_grid($items, 'h2') ?>
        <?php if ($total > count($items)): ?>
        <div class="mt-8 text-center">
          <a href="/objects<?= e(with_query(['limit' => $filters['limit'] + PAGE_SIZE])) ?>" class="<?= e(btn('secondary', 'md')) ?>"><?= e(t('objects.showMore')) ?></a>
        </div>
        <?php endif ?>
        <?php endif ?>
      </div>
    </div>
  </div>
</section>
<?php
page_foot();
