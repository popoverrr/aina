<?php
/** Политика конфиденциальности. Дата редакции меняется при правке текста. */
declare(strict_types=1);

const POLICY_UPDATED = '2026-10-04';

$c = contacts();
$vars = [
    'domain' => (string) (site_data()['site']['domain'] ?? parse_url(site_url(), PHP_URL_HOST)),
    'operator' => (string) legal('operator', ''),
    'phone' => fmt_phone($c['phone']),
];

page_head([
    'title' => t('privacy.meta.title'),
    'description' => t('privacy.meta.description'),
    'path' => '/privacy',
    'noindex' => true,
]);

echo breadcrumbs([['label' => t('common.nav.privacy')]]);

/** Подсвечивает «[ЗАПОЛНИТЬ: …]» внутри готовой строки. */
$highlight = static function (string $text): string {
    $parts = preg_split('/(\[ЗАПОЛНИТЬ[^\]]*\])/u', $text, -1, PREG_SPLIT_DELIM_CAPTURE) ?: [];
    $out = '';
    foreach ($parts as $part) {
        $out .= str_starts_with($part, '[ЗАПОЛНИТЬ')
            ? '<mark class="placeholder-mark">' . e($part) . '</mark>'
            : e($part);
    }
    return $out;
};
?>
<article class="section-y pt-6 lg:pt-8">
  <div class="container-site max-w-3xl">
    <h1><?= e(t('privacy.title')) ?></h1>
    <p class="mt-2 text-sm text-ink-muted"><?= e(t('privacy.updated', ['date' => fmt_date(POLICY_UPDATED)])) ?></p>
    <div class="mt-8 space-y-8">
      <?php foreach (['1', '2', '3', '4', '5', '6', '7', '8'] as $k): ?>
      <section aria-labelledby="privacy-<?= $k ?>">
        <h2 id="privacy-<?= $k ?>" class="text-xl"><?= e(t("privacy.sections.$k.title")) ?></h2>
        <p class="mt-2 text-ink"><?= $highlight(t("privacy.sections.$k.text", $vars)) ?></p>
      </section>
      <?php endforeach ?>
    </div>
  </div>
</article>
<?php
page_foot();
