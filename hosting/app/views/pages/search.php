<?php
/** Подбор объекта: бриф в четыре шага. */
declare(strict_types=1);

page_head([
    'title' => t('search.meta.title'),
    'description' => t('search.meta.description'),
    'path' => '/search',
]);

echo breadcrumbs([['label' => t('common.nav.search')]]);
?>
<section class="section-y pt-6 lg:pt-8">
  <div class="container-site max-w-4xl">
    <div class="mb-10 max-w-2xl">
      <h1><?= e(t('search.title')) ?></h1>
      <p class="mt-3 text-ink-muted"><?= e(t('search.intro')) ?></p>
    </div>
    <?php search_brief_form() ?>
  </div>
</section>
<?php
page_foot();
