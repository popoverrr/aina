<?php
/**
 * Вход в панель: один администратор, пароль хранится только как хеш.
 * Сессия — обычная PHP-сессия с файлами в app/data/sessions (закрыто от веба).
 * Защита формы: CSRF-токен и пауза после неудачных попыток.
 */
declare(strict_types=1);

const SESSION_COOKIE = 'ayna_admin';

/**
 * Сессия стартует только когда нужна: посетителю публичной страницы cookie не выдаётся,
 * пока он не отправил форму. $create = false — поднять уже существующую сессию и не создавать новую.
 * После начала вывода стартовать сессию нельзя, поэтому index.php делает это первым делом.
 */
function session_boot(bool $create = true): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    if (!$create && empty($_COOKIE[SESSION_COOKIE])) {
        return;
    }
    if (headers_sent()) {
        return;
    }
    $dir = DATA_DIR . '/sessions';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    session_name(SESSION_COOKIE);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_save_path($dir);
    @session_start();
}

/** Хеш пароля: из config.php, а при первом запуске — из начального пароля. */
function admin_password_hash(): string
{
    $hash = (string) cfg('admin_password_hash', '');
    if ($hash !== '') {
        return $hash;
    }
    $stored = setting_get('admin');
    if (filled($stored['hash'] ?? null)) {
        return (string) $stored['hash'];
    }
    $initial = (string) cfg('admin_initial_password', '');
    if ($initial === '') {
        return '';
    }
    $made = password_hash($initial, PASSWORD_DEFAULT);
    setting_set('admin', ['hash' => $made, 'initial' => true]);
    return $made;
}

/** Пароль ещё не меняли — панель показывает напоминание. */
function admin_password_is_initial(): bool
{
    if (filled(cfg('admin_password_hash', ''))) {
        return false;
    }
    return !empty(setting_get('admin')['initial']);
}

function admin_set_password(string $password): bool
{
    if (mb_strlen($password) < 8) {
        return false;
    }
    setting_set('admin', ['hash' => password_hash($password, PASSWORD_DEFAULT), 'initial' => false]);
    return true;
}

function is_admin(): bool
{
    session_boot();
    return !empty($_SESSION['admin']);
}

function require_admin(): void
{
    if (!is_admin()) {
        redirect('/admin/login?next=' . rawurlencode($_SERVER['REQUEST_URI'] ?? '/admin'));
    }
}

/** Задержка между попытками входа растёт — перебор пароля становится бессмысленным. */
function login_throttle_seconds(): int
{
    session_boot();
    $fails = (int) ($_SESSION['login_fails'] ?? 0);
    $last = (int) ($_SESSION['login_last'] ?? 0);
    if ($fails < 3) {
        return 0;
    }
    $wait = min(60, 2 ** ($fails - 2));
    $left = $last + $wait - time();
    return $left > 0 ? $left : 0;
}

function admin_login(string $password): bool
{
    session_boot();
    $hash = admin_password_hash();
    $ok = $hash !== '' && password_verify($password, $hash);
    if ($ok) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        unset($_SESSION['login_fails'], $_SESSION['login_last']);
        return true;
    }
    $_SESSION['login_fails'] = (int) ($_SESSION['login_fails'] ?? 0) + 1;
    $_SESSION['login_last'] = time();
    return false;
}

function admin_logout(): void
{
    session_boot();
    $_SESSION = [];
    session_destroy();
}

function csrf_token(): string
{
    session_boot();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return (string) $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '"/>';
}

function csrf_check(): void
{
    session_boot();
    $sent = (string) ($_POST['csrf'] ?? '');
    if ($sent === '' || !hash_equals((string) ($_SESSION['csrf'] ?? ''), $sent)) {
        http_response_code(400);
        echo 'Истёк срок действия формы. Обновите страницу и попробуйте снова.';
        exit;
    }
}

/** Одноразовое сообщение между перенаправлениями («Сохранено»). */
function flash_set(string $text, string $kind = 'ok'): void
{
    session_boot();
    $_SESSION['flash'] = ['text' => $text, 'kind' => $kind];
}

/** Сообщение, не забирая его: нужно, чтобы не перезаписать уже выставленную ошибку. */
function flash_peek(): ?array
{
    session_boot();
    $flash = $_SESSION['flash'] ?? null;
    return is_array($flash) ? $flash : null;
}

function flash_take(): ?array
{
    session_boot();
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return is_array($flash) ? $flash : null;
}
