<?php
/** 404. */
declare(strict_types=1);

http_response_code(404);
page_head(['title' => t('common.notFound.title'), 'path' => '/404', 'noindex' => true]);
?>
<section class="section-y">
  <div class="container-site max-w-2xl text-center">
    <p class="text-sm font-medium text-ink-muted">404</p>
    <h1 class="mt-2"><?= e(t('common.notFound.title')) ?></h1>
    <p class="mt-4 text-ink-muted"><?= e(t('common.notFound.text')) ?></p>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <a href="/objects" class="<?= e(btn('primary', 'md')) ?>"><?= e(t('common.notFound.cta')) ?></a>
      <a href="/" class="<?= e(btn('secondary', 'md')) ?>"><?= e(t('common.actions.toHome')) ?></a>
    </div>
  </div>
</section>
<?php
page_foot();
