<?php
/** Список кейсов. Фильтр по типу объекта — ссылками, чтобы работал и без JavaScript. */
declare(strict_types=1);

$all = all_cases();
$kinds = array_values(array_filter(prop_kinds(), static function (string $k) use ($all): bool {
    foreach ($all as $c) {
        if ($c['kind'] === $k) {
            return true;
        }
    }
    return false;
}));
$selected = in_array(param('kind', ''), $kinds, true) ? (string) param('kind') : '';
$items = $selected === '' ? $all : array_values(array_filter($all, static fn(array $c) => $c['kind'] === $selected));

page_head([
    'title' => t('cases.meta.title'),
    'description' => t('cases.meta.description'),
    'path' => '/cases',
    'noindex' => $selected !== '',
]);

echo breadcrumbs([['label' => t('common.nav.cases')]]);

$chip = static fn(bool $active): string => 'h-9 inline-flex items-center rounded-base border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent '
    . ($active ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-ink-muted');
?>
<section class="section-y pt-6 lg:pt-8">
  <div class="container-site">
    <div class="mb-8 max-w-2xl">
      <h1><?= e(t('cases.title')) ?></h1>
      <p class="mt-3 text-ink-muted"><?= e(t('cases.intro')) ?></p>
    </div>

    <?php if (count($kinds) > 1): ?>
    <div role="group" aria-label="<?= e(t('cases.filter.label')) ?>" class="mb-8 flex flex-wrap gap-2">
      <a href="/cases" class="<?= e($chip($selected === '')) ?>"<?= $selected === '' ? ' aria-current="true"' : '' ?>><?= e(t('cases.filter.all')) ?></a>
      <?php foreach ($kinds as $k): ?>
      <a href="/cases?kind=<?= e($k) ?>" class="<?= e($chip($selected === $k)) ?>"<?= $selected === $k ? ' aria-current="true"' : '' ?>><?= e(kind_label($k)) ?></a>
      <?php endforeach ?>
    </div>
    <?php endif ?>

    <?php if (!$items): ?>
    <p class="text-ink-muted"><?= e(t('cases.empty')) ?></p>
    <?php else: ?>
    <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <?php foreach ($items as $c): ?><li><?php case_card($c, true, 'h2') ?></li><?php endforeach ?>
    </ul>
    <?php endif ?>
  </div>
</section>
<?php
page_foot();
