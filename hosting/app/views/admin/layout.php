<?php
/** Каркас панели: боковая навигация, заголовки, таблицы, уведомления. */
declare(strict_types=1);

function admin_head(string $title, bool $bare = false): void
{
    $newLeads = $bare ? 0 : count_new_leads();
    ?>
<!doctype html>
<html lang="ru" class="h-full antialiased">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title><?= e($title) ?> — <?= e(t('admin.title')) ?></title>
<link rel="icon" href="/agent/avatar-160.jpg"/>
<link rel="stylesheet" href="/assets/site.css?v=<?= e(asset_version()) ?>"/>
</head>
<body class="min-h-full bg-surface-2">
<?php
    if ($bare) {
        echo '<div class="min-h-dvh bg-surface-2">';
        return;
    }
    echo '<div class="min-h-dvh bg-surface-2 lg:grid lg:grid-cols-[240px_1fr]">';
    admin_nav($newLeads);
    echo '<main class="min-w-0 p-4 sm:p-6 lg:p-8">';

    $flash = flash_take();
    if ($flash !== null) {
        echo admin_notice($flash['text'], $flash['kind'] === 'error' ? 'error' : 'success');
    }
    if (admin_password_is_initial()) {
        echo admin_notice('Пароль входа пока стандартный. Смените его в разделе «Настройки» — это важно.', 'error');
    }
}

function admin_foot(bool $bare = false): void
{
    if (!$bare) {
        echo "</main>";
    }
    ?>
</div>
<script src="/assets/admin.js?v=<?= e(asset_version()) ?>" defer></script>
</body>
</html>
<?php
}

function admin_nav(int $newLeads): void
{
    $items = [
        ['/admin/objects', t('admin.nav.objects'), 'building', 0],
        ['/admin/cases', t('admin.nav.cases'), 'briefcase', 0],
        ['/admin/leads', t('admin.nav.leads'), 'inbox', $newLeads],
        ['/admin/settings', t('admin.nav.settings'), 'settings', 0],
    ];
    $linkClass = 'flex items-center gap-3 rounded-base px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
    $current = current_path();
    ?>
<aside class="border-b border-line bg-surface lg:border-r lg:border-b-0">
  <div class="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-5">
    <div>
      <p class="font-semibold"><?= e((string) agent('shortName')) ?></p>
      <p class="text-xs text-ink-muted"><?= e(t('admin.title')) ?></p>
    </div>
  </div>
  <nav aria-label="<?= e(t('admin.title')) ?>" class="px-2 pb-2 lg:px-3">
    <ul class="flex gap-1 overflow-x-auto lg:flex-col">
      <?php foreach ($items as [$href, $label, $ico, $badge]): ?>
      <li class="shrink-0">
        <a href="<?= e($href) ?>" class="<?= e($linkClass) ?><?= str_starts_with($current, $href) ? ' bg-surface-2' : '' ?>"<?= str_starts_with($current, $href) ? ' aria-current="page"' : '' ?>>
          <?= icon($ico) ?><span><?= e($label) ?></span>
          <?php if ($badge): ?><span class="ml-auto rounded-full bg-hot px-2 py-0.5 text-xs text-white tabular"><?= $badge ?></span><?php endif ?>
        </a>
      </li>
      <?php endforeach ?>
      <li class="shrink-0"><a href="/" class="<?= e($linkClass) ?>"><?= icon('external-link') ?><span><?= e(t('admin.nav.site')) ?></span></a></li>
      <li class="shrink-0">
        <form method="post" action="/admin/logout"><?= csrf_field() ?>
          <button type="submit" class="<?= e($linkClass) ?> w-full text-left"><?= icon('log-out') ?><span><?= e(t('admin.nav.logout')) ?></span></button>
        </form>
      </li>
    </ul>
  </nav>
</aside>
<?php
}

function admin_page_header(string $title, string $actions = '', string $below = ''): void
{
    ?>
<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 class="text-2xl"><?= e($title) ?></h1>
    <?= $below ?>
  </div>
  <?php if ($actions !== ''): ?><div class="flex flex-wrap gap-2"><?= $actions ?></div><?php endif ?>
</div>
<?php
}

function admin_notice(string $text, string $tone = 'info'): string
{
    $tones = [
        'info' => 'border-line bg-surface-2 text-ink',
        'error' => 'border-hot/40 bg-hot/5 text-hot',
        'success' => 'border-success/40 bg-success/5 text-success',
    ];
    return '<p role="' . ($tone === 'error' ? 'alert' : 'status') . '" class="mb-5 rounded-base border px-3 py-2 text-sm ' . ($tones[$tone] ?? $tones['info']) . '">' . e($text) . '</p>';
}

function admin_panel_open(?string $title = null, string $class = ''): string
{
    $html = '<section class="rounded-base border border-line bg-surface p-4 shadow-card sm:p-6' . ($class !== '' ? ' ' . $class : '') . '">';
    if (filled($title)) {
        $html .= '<h2 class="mb-4 text-lg">' . e((string) $title) . '</h2>';
    }
    return $html;
}

function admin_panel_close(): string
{
    return '</section>';
}

function admin_table_open(array $columns): string
{
    $html = '<div class="overflow-x-auto rounded-base border border-line bg-surface shadow-card"><table class="w-full min-w-[720px] text-sm">'
        . '<thead class="bg-surface-2 text-left text-xs tracking-wide text-ink-muted uppercase"><tr>';
    foreach ($columns as $col) {
        $html .= '<th scope="col" class="px-3 py-2.5 font-medium">' . e((string) $col) . '</th>';
    }
    return $html . '</tr></thead><tbody class="divide-y divide-line">';
}

function admin_table_close(): string
{
    return '</tbody></table></div>';
}

function td(string $content, string $class = ''): string
{
    return '<td class="px-3 py-2.5 align-middle' . ($class !== '' ? ' ' . $class : '') . '">' . $content . '</td>';
}

/** Кнопка удаления с подтверждением: без JavaScript просто отправляет форму. */
function delete_form(string $action, string $id, string $label): string
{
    return '<form method="post" action="' . e($action) . '" data-confirm="' . e(t('admin.common.confirmDelete')) . '" class="inline">'
        . csrf_field() . '<input type="hidden" name="id" value="' . e($id) . '"/>'
        . '<button type="submit" class="' . e(btn('ghost', 'sm', 'text-hot')) . '" aria-label="' . e($label) . '">' . icon('trash') . '</button></form>';
}
