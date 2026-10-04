<?php
/** Посадочная для собственников. */
declare(strict_types=1);

$rentCases = array_slice(array_values(array_filter(all_cases(), static fn(array $c) => in_array($c['dealType'], ['RENT', 'BOTH'], true))), 0, 3);

page_head([
    'title' => t('owners.meta.title'),
    'description' => t('owners.meta.description'),
    'path' => '/owners',
]);

echo breadcrumbs([['label' => t('common.nav.owners')]]);
?>
<section class="section-y pt-6 lg:pt-8">
  <div class="container-site max-w-3xl">
    <h1><?= e(t('owners.title')) ?></h1>
    <p class="mt-4 text-lg text-ink-muted"><?= e(t('owners.subtitle')) ?></p>
    <a href="#owner-form" class="<?= e(btn('primary', 'lg', 'mt-8')) ?>"><?= e(t('owners.cta')) ?></a>
  </div>
</section>

<?= section_open('muted', '', ['aria-labelledby' => 'why-title']) ?>
<h2 id="why-title"><?= e(t('owners.why.title')) ?></h2>
<p class="mt-3 max-w-2xl text-lg"><?= e(t('owners.why.lead')) ?></p>
<ul class="mt-8 grid gap-6 sm:grid-cols-2">
  <?php foreach (['1', '2', '3', '4'] as $k): ?>
  <li class="rounded-base border border-line bg-surface p-6 shadow-card">
    <h3><?= e(t("owners.why.items.$k.title")) ?></h3>
    <p class="mt-2 text-sm text-ink-muted"><?= e(t("owners.why.items.$k.text")) ?></p>
  </li>
  <?php endforeach ?>
</ul>
<?= section_close() ?>

<?= section_open('default', '', ['aria-labelledby' => 'scope-title']) ?>
<h2 id="scope-title"><?= e(t('owners.scope.title')) ?></h2>
<ul class="mt-6 grid gap-3 sm:grid-cols-2 lg:gap-x-12">
  <?php foreach (['1', '2', '3', '4', '5', '6'] as $k): ?>
  <li class="flex gap-3"><span class="mt-1 shrink-0 text-success"><?= icon('check') ?></span><span><?= e(t("owners.scope.items.$k")) ?></span></li>
  <?php endforeach ?>
</ul>
<?= section_close() ?>

<?= section_open('muted', '', ['aria-labelledby' => 'rent-cases-title']) ?>
<h2 id="rent-cases-title" class="mb-8"><?= e(t('owners.cases.title')) ?></h2>
<?php if ($rentCases): ?>
<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <?php foreach ($rentCases as $c): ?><li><?php case_card($c, false) ?></li><?php endforeach ?>
</ul>
<?php else: ?>
<p class="text-ink-muted"><?= e(t('owners.cases.empty')) ?></p>
<?php endif ?>
<?= section_close() ?>

<?= section_open('default', 'scroll-mt-20', ['aria-labelledby' => 'owner-form-title', 'id' => 'owner-form-section']) ?>
<div class="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
  <div>
    <h2 id="owner-form-title"><?= e(t('owners.form.title')) ?></h2>
    <p class="mt-3 text-ink-muted"><?= e(t('owners.form.text')) ?></p>
  </div>
  <div><?php owner_form(t('owners.form.title'), t('owners.form.note')) ?></div>
</div>
<?= section_close() ?>
<?php
page_foot();
