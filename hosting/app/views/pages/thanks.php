<?php
/** Страница благодарности после отправки заявки. */
declare(strict_types=1);

$type = in_array(param('type', ''), lead_types(), true) ? (string) param('type') : 'CONTACT';

page_head([
    'title' => t('thanks.meta.title'),
    'path' => '/thanks',
    'noindex' => true,
]);
?>
<section class="section-y">
  <div class="container-site max-w-2xl text-center">
    <span class="mx-auto block w-fit text-success"><?= icon('check', 'size-12') ?></span>
    <h1 class="mt-4"><?= e(t('thanks.title')) ?></h1>
    <p class="mt-4 text-lg text-ink-muted"><?= e(t('thanks.byType.' . $type)) ?></p>
    <p class="mt-6 text-sm text-ink-muted"><?= e(t('thanks.fast')) ?></p>
    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <a href="<?= e(whatsapp_url(t('common.whatsappPreset'))) ?>" target="_blank" rel="noopener noreferrer" class="<?= e(btn('whatsapp', 'lg')) ?>">
        <?= icon('message-circle', 'size-5') ?><?= e(t('thanks.whatsapp')) ?>
      </a>
      <a href="/objects" class="<?= e(btn('secondary', 'lg')) ?>"><?= e(t('thanks.objects')) ?></a>
    </div>
  </div>
</section>
<script>window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'lead_submit',lead_type:<?= json_encode($type) ?>});if(window.ym&&window.ymCounter){window.ym(window.ymCounter,'reachGoal','lead_submit');}</script>
<?php
page_foot();
