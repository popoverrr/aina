<?php
/** Об эксперте. Текст от первого лица. */
declare(strict_types=1);

$name = (string) agent('fullName');
$reviews = public_testimonials();

page_head([
    'title' => t('about.meta.title'),
    'description' => t('about.meta.description', ['name' => $name]),
    'path' => '/about',
]);

echo breadcrumbs([['label' => t('common.nav.about')]]);
?>
<section class="section-y pt-6 lg:pt-8">
  <div class="container-site grid items-start gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
    <div class="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-base bg-surface-2 shadow-card lg:sticky lg:top-24">
      <img src="/agent/avatar.jpg" alt="<?= e(t('about.photoAlt', ['name' => $name])) ?>" fetchpriority="high" decoding="async" class="absolute inset-0 size-full object-cover"/>
    </div>
    <div class="space-y-12">
      <header>
        <h1><?= e(t('about.title')) ?></h1>
        <p class="mt-3 text-lg text-ink-muted"><?= e((string) agent('shortName')) ?> · <?= e((string) agent('role')) ?> · <?= e((string) agent('city')) ?></p>
      </header>

      <section aria-labelledby="story-title">
        <h2 id="story-title" class="mb-4 text-xl"><?= e(t('about.story.title')) ?></h2>
        <?= fill_in_text(t('about.story.text')) ?>
      </section>

      <section aria-labelledby="spec-title">
        <h2 id="spec-title" class="mb-4 text-xl"><?= e(t('about.specialization.title')) ?></h2>
        <p><?= e(t('about.specialization.lead')) ?></p>
        <div class="mt-4"><?= fill_in_text(t('about.specialization.why')) ?></div>
      </section>

      <section aria-labelledby="principles-title">
        <h2 id="principles-title" class="mb-4 text-xl"><?= e(t('about.principles.title')) ?></h2>
        <ol class="grid gap-5 sm:grid-cols-2">
          <?php foreach (['1', '2', '3', '4'] as $i => $k): ?>
          <li class="rounded-base border border-line p-5">
            <p class="text-sm font-medium text-ink-muted tabular">0<?= $i + 1 ?></p>
            <h3 class="mt-1 text-base"><?= e(t("about.principles.items.$k.title")) ?></h3>
            <p class="mt-2 text-sm text-ink-muted"><?= e(t("about.principles.items.$k.text")) ?></p>
          </li>
          <?php endforeach ?>
        </ol>
      </section>

      <section aria-labelledby="support-title">
        <h2 id="support-title" class="mb-4 text-xl"><?= e(t('about.support.title')) ?></h2>
        <ul class="space-y-2.5">
          <?php foreach (['1', '2', '3', '4', '5', '6'] as $k): ?>
          <li class="flex gap-3"><span class="mt-1 shrink-0 text-success"><?= icon('check') ?></span><span><?= e(t("about.support.items.$k")) ?></span></li>
          <?php endforeach ?>
        </ul>
      </section>
    </div>
  </div>
</section>

<?= section_open('muted', '', ['aria-labelledby' => 'work-title']) ?>
<h2 id="work-title"><?= e(t('about.work.title')) ?></h2>
<p class="mt-2 mb-8 text-ink-muted"><?= e(t('about.work.text')) ?></p>
<ul class="grid grid-cols-2 gap-4 md:grid-cols-3">
  <?php for ($n = 1; $n <= 6; $n++): ?>
  <?php $file = ROOT_DIR . "/agent/work/$n.jpg"; ?>
  <li class="relative aspect-[4/3] overflow-hidden rounded-base bg-surface">
    <?php if (is_file($file)): ?>
    <img src="/agent/work/<?= $n ?>.jpg" alt="<?= e((string) agent('shortName')) ?>, кадр с объекта <?= $n ?>" loading="lazy" decoding="async" class="absolute inset-0 size-full object-cover"/>
    <?php else: ?>
    <?= image_placeholder(t('common.placeholders.workPhoto', ['n' => $n])) ?>
    <?php endif ?>
  </li>
  <?php endfor ?>
</ul>
<?= section_close() ?>

<?php testimonials_section($reviews, t('about.testimonials.title')) ?>

<?= section_open('default', '', ['aria-labelledby' => 'about-cta-title']) ?>
<div class="rounded-base border border-line bg-surface-2 p-8 text-center lg:p-12">
  <h2 id="about-cta-title"><?= e(t('about.cta.title')) ?></h2>
  <p class="mx-auto mt-3 max-w-xl text-ink-muted"><?= e(t('about.cta.text')) ?></p>
  <a href="<?= e(whatsapp_url(t('common.whatsappPreset'))) ?>" target="_blank" rel="noopener noreferrer" class="<?= e(btn('whatsapp', 'lg', 'mt-6')) ?>">
    <?= icon('message-circle', 'size-5') ?><?= e(t('about.cta.button')) ?>
  </a>
</div>
<?= section_close() ?>
<?php
page_foot();
