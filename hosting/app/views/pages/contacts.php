<?php
/** Контакты. Незаполненные строки не выводятся вообще. */
declare(strict_types=1);

$c = contacts();
$rowClass = 'flex items-center gap-4 rounded-base border border-line bg-surface p-4 transition-[border-color] hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

$rows = [
    ['phone', t('contacts.phone'), fmt_phone($c['phone']), phone_href($c['phone']), 'phone', false],
    ['whatsapp', t('contacts.whatsapp'), fmt_phone('+' . $c['whatsapp']), whatsapp_url(t('common.whatsappPreset')), 'message-circle', true],
];
if (filled($c['telegram'])) {
    $handle = telegram_handle($c['telegram']);
    $rows[] = ['telegram', t('contacts.telegram'), $handle !== null ? '@' . $handle : fmt_phone($c['phone']), telegram_link($c['telegram']), 'send', true];
}
if (filled($c['instagram'])) {
    $rows[] = ['instagram', t('contacts.instagram'), '@' . $c['instagram'], instagram_link($c['instagram']), 'camera', true];
}
if (filled($c['email'])) {
    $rows[] = ['email', t('contacts.email'), $c['email'], 'mailto:' . $c['email'], 'at-sign', false];
}

page_head([
    'title' => t('contacts.meta.title'),
    'description' => t('contacts.meta.description', ['name' => (string) agent('fullName')]),
    'path' => '/contacts',
]);

echo breadcrumbs([['label' => t('common.nav.contacts')]]);
?>
<section class="section-y pt-6 lg:pt-8">
  <div class="container-site grid gap-12 lg:grid-cols-2 lg:gap-16">
    <div>
      <h1><?= e(t('contacts.title')) ?></h1>
      <p class="mt-3 text-ink-muted"><?= e(t('contacts.intro')) ?></p>
      <ul class="mt-8 space-y-3">
        <?php foreach ($rows as [$key, $label, $value, $href, $ico, $external]): ?>
        <li>
          <a href="<?= e($href) ?>" class="<?= e($rowClass) ?>"<?= $external ? ' target="_blank" rel="noopener noreferrer"' : '' ?>>
            <span class="shrink-0 text-accent"><?= icon($ico, 'size-5') ?></span>
            <span class="flex min-w-0 flex-col">
              <span class="text-xs text-ink-muted"><?= e($label) ?></span>
              <span class="truncate font-medium tabular"><?= e($value) ?></span>
            </span>
          </a>
        </li>
        <?php endforeach ?>
      </ul>
      <dl class="mt-8 space-y-2 text-sm">
        <div class="flex gap-3">
          <dt class="w-24 shrink-0 text-ink-muted"><?= e(t('contacts.city')) ?></dt>
          <dd><?= e((string) agent('city')) ?></dd>
        </div>
        <?php if (filled(legal('entity'))): ?>
        <div class="flex gap-3">
          <dt class="w-24 shrink-0 text-ink-muted"><?= e(t('contacts.legal')) ?></dt>
          <dd><?= e((string) legal('entity')) ?></dd>
        </div>
        <?php endif ?>
      </dl>
    </div>

    <div class="rounded-base border border-line bg-surface-2 p-6 lg:p-8">
      <h2 class="text-xl"><?= e(t('contacts.form.title')) ?></h2>
      <p class="mt-2 mb-6 text-sm text-ink-muted"><?= e(t('contacts.form.text')) ?></p>
      <?php lead_form(['type' => 'CONTACT', 'note' => t('contacts.form.note'), 'idPrefix' => 'contacts', 'back' => '/contacts']) ?>
    </div>
  </div>
</section>
<?php
page_foot();
