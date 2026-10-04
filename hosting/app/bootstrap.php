<?php
/**
 * Общая инициализация PHP-версии сайта: конфиг, база, словарь, вспомогательные функции.
 * Подключается первой строкой из index.php.
 */
declare(strict_types=1);

define('APP_DIR', __DIR__);
define('ROOT_DIR', dirname(__DIR__));
define('DATA_DIR', APP_DIR . '/data');
define('UPLOADS_DIR', ROOT_DIR . '/uploads');

mb_internal_encoding('UTF-8');
date_default_timezone_set('Asia/Almaty');

// При первом запуске конфиг создаётся из образца, чтобы сайт поднялся без правок файлов.
if (!is_file(APP_DIR . '/config.php') && is_file(APP_DIR . '/config.example.php')) {
    @copy(APP_DIR . '/config.example.php', APP_DIR . '/config.php');
}
$config = is_file(APP_DIR . '/config.php') ? require APP_DIR . '/config.php' : require APP_DIR . '/config.example.php';

foreach (['util', 'format', 'i18n', 'db', 'content', 'objects', 'cases', 'testimonials', 'leads', 'notify', 'auth', 'images', 'admin', 'ui'] as $lib) {
    require_once APP_DIR . '/lib/' . $lib . '.php';
}

cfg_init($config);
db_init();
