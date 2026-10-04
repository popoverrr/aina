<?php
/** Страница кейса. */
declare(strict_types=1);

/** @var array $item подготовлено роутером */
$c = $item;
$similar = similar_properties($c['kind'], null, 3);

$facts = [];
if (filled($c['district'])) {
    $facts[] = [t('cases.detail.district'), $c['district']];
}
if ($c['areaM2'] !== null) {
    $facts[] = [t('cases.detail.area'), fmt_area($c['areaM2'])];
}
if (filled($c['amountLabel'])) {
    $facts[] = [t('cases.detail.amount'), $c['amountLabel']];
}
if (filled($c['durationLabel'])) {
    $facts[] = [t('cases.detail.duration'), $c['durationLabel']];
}

page_head([
    'title' => $c['title'],
    'description' => mb_substr($c['result'], 0, 160),
    'path' => '/cases/' . $c['slug'],
    'ogImage' => filled($c['coverUrl']) ? $c['coverUrl'] : '/og-default.jpg',
]);

echo breadcrumbs([['label' => t('common.nav.cases'), 'href' => '/cases'], ['label' => $c['title']]]);
?>
<article class="section-y pt-6 lg:pt-8">
  <div class="container-site">
    <header class="max-w-3xl">
      <div class="mb-3 flex flex-wrap gap-2">
        <?= badge_tone(kind_label($c['kind']), 'muted') ?>
        <?= badge_tone(deal_label($c['dealType']), 'muted') ?>
      </div>
      <h1><?= e($c['title']) ?></h1>
    </header>

    <div class="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
      <div class="space-y-10">
        <div class="relative aspect-[16/9] w-full overflow-hidden rounded-base bg-surface-2">
          <?php if (filled($c['coverUrl'])): ?>
          <img src="<?= e($c['coverUrl']) ?>" alt="<?= e(t('cases.detail.coverAlt', ['title' => $c['title']])) ?>" fetchpriority="high" decoding="async" class="absolute inset-0 size-full object-cover"/>
          <?php else: ?>
          <?= image_placeholder(t('common.placeholders.caseCover')) ?>
          <?php endif ?>
        </div>

        <?php foreach ([['task', $c['task']], ['solution', $c['solution']], ['result', $c['result']]] as [$key, $text]): ?>
        <section aria-labelledby="case-<?= e($key) ?>">
          <h2 id="case-<?= e($key) ?>" class="mb-3 text-xl"><?= e(t('cases.detail.' . $key)) ?></h2>
          <div class="prose-site"><?= render_markdown($text) ?></div>
        </section>
        <?php endforeach ?>
      </div>

      <?php if ($facts): ?>
      <aside class="lg:sticky lg:top-20 lg:self-start">
        <dl class="divide-y divide-line rounded-base border border-line bg-surface p-5 shadow-card">
          <?php foreach ($facts as [$label, $value]): ?>
          <div class="flex justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
            <dt class="text-ink-muted"><?= e($label) ?></dt>
            <dd class="text-right font-medium tabular"><?= e((string) $value) ?></dd>
          </div>
          <?php endforeach ?>
        </dl>
      </aside>
      <?php endif ?>
    </div>

    <section aria-labelledby="similar-title" class="mt-16 lg:mt-24">
      <h2 id="similar-title" class="mb-6"><?= e(t('cases.detail.similar')) ?></h2>
      <?php if ($similar): ?>
      <?php property_grid($similar) ?>
      <?php else: ?>
      <div class="rounded-base border border-dashed border-line bg-surface-2 p-8 text-center">
        <p class="text-ink-muted"><?= e(t('cases.detail.similarEmpty')) ?></p>
        <a href="/search" class="<?= e(btn('primary', 'md', 'mt-5')) ?>"><?= e(t('cases.detail.similarCta')) ?></a>
      </div>
      <?php endif ?>
    </section>
  </div>
</article>
<?php
page_foot();
