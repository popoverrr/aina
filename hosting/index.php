<?php
/**
 * Единая точка входа. .htaccess направляет сюда все запросы, кроме существующих файлов.
 */
declare(strict_types=1);

require __DIR__ . '/app/bootstrap.php';
require APP_DIR . '/views/layout.php';
require APP_DIR . '/views/cards.php';
require APP_DIR . '/views/forms.php';

// Сессию поднимаем до вывода: в ней лежат ошибки форм и вход в панель.
session_boot(false);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = '/' . trim(rawurldecode($path), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Служебные адреса
if ($path === '/robots.txt') {
    header('Content-Type: text/plain; charset=utf-8');
    echo "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /thanks\n\nSitemap: " . abs_url('/sitemap.xml') . "\n";
    exit;
}
if ($path === '/sitemap.xml') {
    render_sitemap();
    exit;
}

// Панель управления
if ($path === '/admin' || str_starts_with($path, '/admin/')) {
    require APP_DIR . '/views/admin/router.php';
    admin_route(substr($path, 6), $method);
    exit;
}

// Приём заявок
if ($path === '/lead') {
    if ($method !== 'POST') {
        redirect('/contacts');
    }
    handle_lead();
    exit;
}

switch (true) {
    case $path === '/' || $path === '':
        require APP_DIR . '/views/pages/home.php';
        break;
    case $path === '/objects':
        require APP_DIR . '/views/pages/objects.php';
        break;
    case (bool) preg_match('#^/objects/([a-z0-9-]+)$#', $path, $m):
        $property = find_property_by_slug($m[1]);
        if (!$property) {
            require APP_DIR . '/views/pages/not-found.php';
            break;
        }
        $property = public_property($property, $property['isExclusive'] ? is_property_unlocked($property['id']) : true);
        require APP_DIR . '/views/pages/object.php';
        break;
    case $path === '/cases':
        require APP_DIR . '/views/pages/cases.php';
        break;
    case (bool) preg_match('#^/cases/([a-z0-9-]+)$#', $path, $m):
        $item = find_case_by_slug($m[1]);
        if (!$item) {
            require APP_DIR . '/views/pages/not-found.php';
            break;
        }
        require APP_DIR . '/views/pages/case.php';
        break;
    case $path === '/about':
    case $path === '/owners':
    case $path === '/search':
    case $path === '/contacts':
    case $path === '/privacy':
    case $path === '/thanks':
        require APP_DIR . '/views/pages/' . ltrim($path, '/') . '.php';
        break;
    default:
        require APP_DIR . '/views/pages/not-found.php';
}

/**
 * Приём заявки. При ошибке — обратно на страницу формы с подсветкой полей,
 * при успехе — на /thanks. Заявка сохраняется даже если уведомления не ушли.
 */
function handle_lead(): never
{
    $src = $_POST;
    $type = (string) ($src['type'] ?? 'CONTACT');
    $back = (string) ($src['back'] ?? '/contacts');
    // Возвращаемся только на свои страницы: внешний адрес в скрытом поле подставить нельзя.
    if (!preg_match('#^/[A-Za-z0-9/_-]*$#', $back)) {
        $back = '/contacts';
    }
    $anchor = (string) ($src['anchor'] ?? '');

    if (lead_is_spam($src)) {
        // Боту отвечаем как при успехе: иначе он подберёт обход.
        redirect('/thanks?type=' . rawurlencode($type), 303);
    }

    $checked = validate_lead($type, $src);
    if ($checked['errors']) {
        session_boot();
        $_SESSION['form_state'] = [
            'errors' => $checked['errors'],
            'old' => array_intersect_key($src, array_flip(['name', 'phone', 'comment', 'briefKind', 'dealType', 'areaFrom', 'areaTo', 'budget', 'business', 'districts'])),
        ];
        redirect($back . ($anchor !== '' ? '#' . $anchor : ''), 303);
    }

    $data = $checked['data'];
    try {
        $leadId = create_lead($data, lead_meta($src));
    } catch (Throwable $e) {
        log_error('lead', $e->getMessage());
        session_boot();
        $_SESSION['form_state'] = ['general' => 'dbError', 'old' => $src];
        redirect($back . ($anchor !== '' ? '#' . $anchor : ''), 303);
    }

    // Заявка по объекту открывает его закрытые детали этому посетителю.
    if (filled($data['propertyId'])) {
        unlock_property((string) $data['propertyId']);
    }

    notify_lead($data, $leadId);
    redirect('/thanks?type=' . rawurlencode($data['type']), 303);
}

function render_sitemap(): void
{
    header('Content-Type: application/xml; charset=utf-8');
    $urls = [
        ['/', '1.0', 'daily'],
        ['/objects', '0.9', 'daily'],
        ['/cases', '0.8', 'weekly'],
        ['/about', '0.7', 'monthly'],
        ['/owners', '0.8', 'monthly'],
        ['/search', '0.7', 'monthly'],
        ['/contacts', '0.6', 'monthly'],
    ];
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as [$loc, $priority, $freq]) {
        echo '  <url><loc>' . e(abs_url($loc)) . '</loc><changefreq>' . $freq . '</changefreq><priority>' . $priority . "</priority></url>\n";
    }
    foreach (public_property_slugs() as $row) {
        echo '  <url><loc>' . e(abs_url('/objects/' . $row['slug'])) . '</loc><lastmod>' . e(substr((string) $row['updated_at'], 0, 10)) . "</lastmod><priority>0.8</priority></url>\n";
    }
    foreach (case_slugs() as $row) {
        echo '  <url><loc>' . e(abs_url('/cases/' . $row['slug'])) . '</loc><lastmod>' . e(substr((string) $row['created_at'], 0, 10)) . "</lastmod><priority>0.6</priority></url>\n";
    }
    echo "</urlset>\n";
}
