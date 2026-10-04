<?php
/** Карточки объектов и кейсов, цена, заглушки — всё, что повторяется в списках. */
declare(strict_types=1);

/** Плашка: тона совпадают с Badge из Next-версии. */
function badge_tone(string $text, string $tone = 'neutral'): string
{
    $tones = [
        'hot' => 'bg-hot text-white',
        'accent' => 'bg-accent text-white',
        'neutral' => 'bg-ink text-white',
        'success' => 'bg-success text-white',
        'muted' => 'bg-surface-2 text-ink-muted border border-line',
    ];
    return '<span class="inline-flex h-6 items-center rounded-base px-2 text-xs font-medium tracking-wide ' . ($tones[$tone] ?? $tones['neutral']) . '">' . e($text) . '</span>';
}

/** Незаполненное значение показываем как заметную заглушку, а не придуманное число. */
function is_placeholder(mixed $value): bool
{
    return !filled($value) || (is_string($value) && str_contains($value, '[ЗАПОЛНИТЬ'));
}

function fill_in(mixed $value, string $class = ''): string
{
    if (is_placeholder($value)) {
        $text = is_string($value) && $value !== '' ? $value : '[ЗАПОЛНИТЬ]';
        return '<mark class="placeholder-mark' . ($class !== '' ? ' ' . $class : '') . '">' . e($text) . '</mark>';
    }
    return e((string) $value);
}

/** Текст в абзацах; заглушка подсвечивается целиком. */
function fill_in_text(string $value, string $class = ''): string
{
    if (is_placeholder($value)) {
        return '<p' . ($class !== '' ? ' class="' . e($class) . '"' : '') . '><mark class="placeholder-mark">' . e($value) . '</mark></p>';
    }
    $html = '<div class="prose-site' . ($class !== '' ? ' ' . $class : '') . '">';
    foreach (preg_split('/\R{2,}/u', $value) ?: [] as $p) {
        $p = trim($p);
        if ($p !== '') {
            $html .= '<p>' . e($p) . '</p>';
        }
    }
    return $html . '</div>';
}

function image_placeholder(string $label, string $class = ''): string
{
    return '<div class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-line bg-surface-2 p-4 text-center text-xs text-ink-muted'
        . ($class !== '' ? ' ' . $class : '') . '" role="img" aria-label="' . e($label) . '">'
        . icon('image-off', 'size-6 opacity-60') . '<span>' . e($label) . '</span></div>';
}

/** Цена объекта. Единственное место, где решается, что показать. */
function property_price(array $p, string $size = 'md', string $class = ''): string
{
    $main = $size === 'lg' ? 'text-2xl font-semibold' : ($size === 'sm' ? 'text-base font-semibold' : 'text-lg font-semibold');
    $sub = 'text-sm text-ink-muted';
    $onRequest = $p['priceSale'] === null && $p['priceRentTotal'] === null && $p['priceRentM2'] === null;
    if ($onRequest) {
        return '<p class="' . $main . ' tabular' . ($class !== '' ? ' ' . $class : '') . '">' . e(t('objects.card.priceOnRequest')) . '</p>';
    }
    $rent = $p['priceRentTotal'] !== null ? fmt_price($p['priceRentTotal']) : ($p['priceRentM2'] !== null ? fmt_price_m2($p['priceRentM2']) : null);
    $sale = $p['priceSale'] !== null ? fmt_price($p['priceSale']) : null;

    $html = '<div class="tabular' . ($class !== '' ? ' ' . $class : '') . '">';
    if ($p['dealType'] !== 'SALE' && $rent !== null) {
        $html .= '<p class="' . $main . '">' . e($rent);
        if ($p['priceRentTotal'] !== null) {
            $html .= '<span class="' . $sub . ' ml-1.5 font-normal">' . e(t('objects.card.perMonth')) . '</span>';
        }
        $html .= '</p>';
    }
    if ($p['dealType'] !== 'RENT' && $sale !== null) {
        $html .= '<p class="' . ($p['dealType'] === 'BOTH' && $rent !== null ? $sub : $main) . '">' . e($sale) . '</p>';
    }
    if ($p['dealType'] !== 'SALE' && $p['priceRentTotal'] !== null && $p['priceRentM2'] !== null) {
        $html .= '<p class="' . $sub . '">' . e(fmt_price_m2($p['priceRentM2'])) . '</p>';
    }
    return $html . '</div>';
}

/** Карточка объекта в списке. */
function property_card(array $p, string $heading = 'h3'): void
{
    $kind = kind_label($p['kind']);
    $area = $p['areaM2'] !== null ? fmt_area($p['areaM2']) : $p['areaLabel'];
    ?>
<article class="group relative flex h-full flex-col overflow-hidden rounded-base border border-line bg-surface shadow-card transition-[border-color,box-shadow] hover:border-ink-muted/60 focus-within:border-accent">
  <div class="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
    <?php if ($p['cover']): ?>
    <img src="<?= e($p['cover']['url']) ?>" alt="<?= e(filled($p['cover']['alt']) ? $p['cover']['alt'] : t('objects.card.imageAlt', ['kind' => $kind, 'area' => $area, 'district' => $p['district']])) ?>"
         width="<?= (int) ($p['cover']['width'] ?: 800) ?>" height="<?= (int) ($p['cover']['height'] ?: 600) ?>" loading="lazy" decoding="async"
         class="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"/>
    <?php else: ?>
    <?= image_placeholder(t('common.placeholders.photo')) ?>
    <?php endif ?>
    <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
      <?php if ($p['isHot']) echo badge_tone(t('common.badges.hot'), 'hot') ?>
      <?php if ($p['isExclusive']) echo badge_tone(t('common.badges.exclusive'), 'accent') ?>
      <?php if ($p['status'] === 'RESERVED') echo badge_tone(t('common.badges.reserved'), 'neutral') ?>
    </div>
  </div>

  <div class="flex flex-1 flex-col gap-2 p-4">
    <p class="text-sm text-ink-muted"><?= e($kind) ?> · <?= e($p['district']) ?></p>
    <<?= $heading ?> class="text-base leading-snug font-semibold">
      <a href="/objects/<?= e($p['slug']) ?>" class="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"><?= e($p['title']) ?></a>
    </<?= $heading ?>>
    <p class="text-sm tabular"><?= e($area) ?></p>
    <?= property_price($p, 'sm') ?>
    <?php if ($p['advantages']): ?>
    <ul class="mt-1 space-y-1 text-sm text-ink-muted">
      <?php foreach (array_slice($p['advantages'], 0, 2) as $a): ?>
      <li class="flex gap-2"><span class="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true"></span><span><?= e((string) $a) ?></span></li>
      <?php endforeach ?>
    </ul>
    <?php endif ?>
  </div>
</article>
<?php
}

function property_grid(array $items, string $heading = 'h3'): void
{
    echo '<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">';
    foreach ($items as $p) {
        echo '<li>';
        property_card($p, $heading);
        echo '</li>';
    }
    echo '</ul>';
}

/** Карточка кейса. На главной — без обложки. */
function case_card(array $c, bool $withCover = true, string $heading = 'h3'): void
{
    ?>
<article class="group relative flex h-full flex-col overflow-hidden rounded-base border border-line bg-surface shadow-card transition-[border-color] hover:border-ink-muted/60 focus-within:border-accent">
  <?php if ($withCover): ?>
  <div class="relative aspect-[16/9] w-full bg-surface-2">
    <?php if (filled($c['coverUrl'])): ?>
    <img src="<?= e($c['coverUrl']) ?>" alt="<?= e(t('cases.detail.coverAlt', ['title' => $c['title']])) ?>" loading="lazy" decoding="async" class="absolute inset-0 size-full object-cover"/>
    <?php else: ?>
    <?= image_placeholder(t('common.placeholders.caseCover')) ?>
    <?php endif ?>
  </div>
  <?php endif ?>
  <div class="flex flex-1 flex-col gap-3 p-5">
    <div class="flex flex-wrap items-center gap-2">
      <?= badge_tone(kind_label($c['kind']), 'muted') ?>
      <?= badge_tone(deal_label($c['dealType']), 'muted') ?>
    </div>
    <<?= $heading ?> class="text-lg leading-snug font-semibold">
      <a href="/cases/<?= e($c['slug']) ?>" class="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"><?= e($c['title']) ?></a>
    </<?= $heading ?>>
    <dl class="space-y-2 text-sm">
      <div><dt class="text-ink-muted"><?= e(t('cases.card.task')) ?></dt><dd class="line-clamp-2"><?= e($c['task']) ?></dd></div>
      <div><dt class="text-ink-muted"><?= e(t('cases.card.result')) ?></dt><dd class="line-clamp-2 font-medium"><?= e($c['result']) ?></dd></div>
    </dl>
    <div class="mt-auto flex items-center justify-between pt-2 text-sm">
      <span class="text-ink-muted tabular"><?= e((string) ($c['durationLabel'] ?? '')) ?></span>
      <span class="inline-flex items-center gap-1 font-medium text-accent-ink group-hover:underline"><?= e(t('cases.card.read')) ?><?= icon('arrow-right') ?></span>
    </div>
  </div>
</article>
<?php
}

/** Отзывы. Меньше двух — блок не выводится вообще. */
function testimonials_section(array $items, string $title, string $tone = 'default'): void
{
    if (count($items) < 2) {
        return;
    }
    echo section_open($tone, '', ['aria-labelledby' => 'testimonials-title']);
    echo section_header($title, null, null, 'h2', 'testimonials-title');
    echo '<ul class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">';
    foreach ($items as $item) {
        echo '<li class="flex flex-col gap-4 rounded-base border border-line bg-surface p-6 shadow-card">';
        echo '<span class="text-accent" aria-hidden="true">' . icon('quote', 'size-5') . '</span>';
        echo '<blockquote class="flex-1 text-ink"><p>' . e($item['text']) . '</p></blockquote>';
        echo '<footer class="text-sm"><p class="font-medium">' . e($item['author']) . '</p>';
        if (filled($item['role'])) {
            echo '<p class="text-ink-muted">' . e($item['role']) . '</p>';
        }
        echo '</footer></li>';
    }
    echo '</ul>';
    echo section_close();
}
