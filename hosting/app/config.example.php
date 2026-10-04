<?php
/**
 * Настройки сайта. При первом запуске копируется в config.php — правьте config.php,
 * он не перезаписывается при выкладке (см. PROTECT в deploy/ftp.env).
 */
return [
    // Публичный адрес сайта: нужен для canonical, sitemap и карточек в мессенджерах.
    'site_url' => 'https://ainaestate.asia',

    // Вход в админку. Пароль хранится хэшем: сгенерировать можно в /admin после входа
    // или командой: php -r "echo password_hash('пароль', PASSWORD_DEFAULT);"
    'admin_email' => 'admin@ainaestate.asia',
    'admin_password_hash' => '',
    // Пока хэш пустой, вход работает по этому паролю и при первом входе хэш запишется сам.
    'admin_initial_password' => 'ainaestate2026',

    // Уведомления о заявках в Telegram. Без токена заявки просто пишутся в базу.
    'telegram_bot_token' => '',
    'telegram_chat_id' => '',

    // Счётчики аналитики. Пусто — скрипты не подключаются.
    'ga4_id' => '',
    'metrika_id' => '',
];
