<?php
/** Разбор адресов панели. Всё, кроме входа, доступно только после авторизации. */
declare(strict_types=1);

require APP_DIR . '/views/admin/layout.php';

function admin_route(string $sub, string $method): void
{
    $sub = '/' . trim($sub, '/');

    if ($sub === '/login') {
        admin_login_page($method);
        return;
    }
    if ($sub === '/logout') {
        if ($method === 'POST') {
            csrf_check();
            admin_logout();
        }
        redirect('/admin/login');
    }

    require_admin();

    switch (true) {
        case $sub === '/' || $sub === '':
            redirect('/admin/objects');
        case $sub === '/objects':
            require APP_DIR . '/views/admin/objects.php';
            admin_objects_list();
            return;
        case $sub === '/objects/new':
            require APP_DIR . '/views/admin/objects.php';
            admin_object_form(null, $method);
            return;
        case (bool) preg_match('#^/objects/([a-f0-9]{24})$#', $sub, $m):
            require APP_DIR . '/views/admin/objects.php';
            admin_object_form($m[1], $method);
            return;
        case $sub === '/objects/delete':
            require APP_DIR . '/views/admin/objects.php';
            admin_object_delete();
            return;
        case $sub === '/objects/flag':
            require APP_DIR . '/views/admin/objects.php';
            admin_object_flag();
            return;
        case $sub === '/photos':
            require APP_DIR . '/views/admin/objects.php';
            admin_photos_action();
            return;
        case $sub === '/cases':
            require APP_DIR . '/views/admin/cases.php';
            admin_cases_list();
            return;
        case $sub === '/cases/new':
            require APP_DIR . '/views/admin/cases.php';
            admin_case_form(null, $method);
            return;
        case (bool) preg_match('#^/cases/([a-f0-9]{24})$#', $sub, $m):
            require APP_DIR . '/views/admin/cases.php';
            admin_case_form($m[1], $method);
            return;
        case $sub === '/cases/delete':
            require APP_DIR . '/views/admin/cases.php';
            admin_case_delete();
            return;
        case $sub === '/leads':
            require APP_DIR . '/views/admin/leads.php';
            admin_leads_page($method);
            return;
        case $sub === '/leads/export':
            require APP_DIR . '/views/admin/leads.php';
            admin_leads_export();
            return;
        case $sub === '/settings':
            require APP_DIR . '/views/admin/settings.php';
            admin_settings_page($method);
            return;
        default:
            http_response_code(404);
            admin_head('404');
            admin_page_header('Страница не найдена');
            echo '<p class="text-ink-muted">Такого раздела в панели нет.</p>';
            admin_foot();
    }
}

function admin_login_page(string $method): void
{
    if (is_admin()) {
        redirect('/admin/objects');
    }
    $error = null;
    $wait = login_throttle_seconds();

    if ($method === 'POST') {
        csrf_check();
        if ($wait > 0) {
            $error = 'Слишком много попыток. Подождите ' . $wait . ' с.';
        } elseif (admin_login(post('password'))) {
            $next = (string) ($_POST['next'] ?? '/admin/objects');
            redirect(preg_match('#^/admin#', $next) ? $next : '/admin/objects', 303);
        } else {
            $error = t('admin.login.error');
        }
    }

    admin_head(t('admin.login.title'), true);
    ?>
<div class="flex min-h-dvh items-center justify-center p-4">
  <form method="post" action="/admin/login" class="w-full max-w-sm space-y-4 rounded-base border border-line bg-surface p-6 shadow-card">
    <?= csrf_field() ?>
    <input type="hidden" name="next" value="<?= e((string) param('next', '/admin/objects')) ?>"/>
    <div>
      <h1 class="text-xl"><?= e(t('admin.login.title')) ?></h1>
      <p class="mt-1 text-sm text-ink-muted"><?= e((string) agent('shortName')) ?></p>
    </div>
    <?php if ($error !== null): ?><?= admin_notice($error, 'error') ?><?php endif ?>
    <div class="flex flex-col gap-1.5">
      <label for="password" class="text-sm font-medium text-ink"><?= e(t('admin.login.password')) ?></label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus class="<?= e(CONTROL_CLASS . ' h-11') ?>"/>
    </div>
    <button type="submit" class="<?= e(btn('primary', 'md', 'w-full')) ?>"><?= e(t('admin.login.submit')) ?></button>
  </form>
</div>
<?php
    admin_foot(true);
}
