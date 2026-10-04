<?php
/** Мелкие помощники: конфиг, экранирование, адреса, идентификаторы. */
declare(strict_types=1);

function cfg_init(array $config): void
{
    $GLOBALS['__cfg'] = $config;
}

function cfg(string $key, mixed $default = null): mixed
{
    return $GLOBALS['__cfg'][$key] ?? $default;
}

/** Экранирование для HTML. Любой текст из базы и из запроса выводится только через неё. */
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function site_url(): string
{
    return rtrim((string) cfg('site_url', ''), '/');
}

/** Абсолютный адрес страницы для canonical и OpenGraph. */
function abs_url(string $path = '/'): string
{
    return site_url() . '/' . ltrim($path, '/');
}

function redirect(string $path, int $code = 302): never
{
    header('Location: ' . (str_starts_with($path, 'http') ? $path : '/' . ltrim($path, '/')), true, $code);
    exit;
}

function new_id(): string
{
    return bin2hex(random_bytes(12));
}

/** Транслитерация в slug: «Стрит-ритейл 120 м²» → «strit-riteyl-120-m2». */
function slugify(string $input): string
{
    static $map = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'е' => 'e', 'ё' => 'yo', 'ж' => 'zh',
        'з' => 'z', 'и' => 'i', 'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm', 'н' => 'n', 'о' => 'o',
        'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u', 'ф' => 'f', 'х' => 'kh', 'ц' => 'ts',
        'ч' => 'ch', 'ш' => 'sh', 'щ' => 'sch', 'ъ' => '', 'ы' => 'y', 'ь' => '', 'э' => 'e', 'ю' => 'yu',
        'я' => 'ya', 'ә' => 'a', 'ғ' => 'g', 'қ' => 'q', 'ң' => 'n', 'ө' => 'o', 'ұ' => 'u', 'ү' => 'u',
        'һ' => 'h', 'і' => 'i', '²' => '2',
    ];
    $s = mb_strtolower(trim($input));
    $s = strtr($s, $map);
    $s = preg_replace('/[^a-z0-9]+/u', '-', $s) ?? '';
    return trim(mb_substr(preg_replace('/-{2,}/', '-', $s) ?? '', 0, 80), '-');
}

function is_valid_slug(string $slug): bool
{
    return (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug);
}

/** Значение задано и это не пустая строка. */
function filled(mixed $value): bool
{
    return $value !== null && $value !== '' && $value !== false;
}

function param(string $key, ?string $default = null): ?string
{
    $v = $_GET[$key] ?? null;
    return is_string($v) && $v !== '' ? $v : $default;
}

function post(string $key, string $default = ''): string
{
    $v = $_POST[$key] ?? null;
    return is_string($v) ? trim($v) : $default;
}

function post_bool(string $key): bool
{
    return isset($_POST[$key]) && $_POST[$key] !== '' && $_POST[$key] !== '0';
}

/** Числовое поле формы: пустое значение превращается в null. */
function post_num(string $key): ?float
{
    $raw = str_replace([' ', ' ', ','], ['', '', '.'], post($key));
    if ($raw === '') {
        return null;
    }
    return is_numeric($raw) ? (float) $raw : null;
}

/** Адрес каталога с изменёнными параметрами фильтра. */
function with_query(array $changes, array $base = null): string
{
    $q = $base ?? $_GET;
    foreach ($changes as $k => $v) {
        if ($v === null || $v === '' || $v === []) {
            unset($q[$k]);
        } else {
            $q[$k] = $v;
        }
    }
    $qs = http_build_query($q);
    return $qs === '' ? '?' : '?' . $qs;
}

/** Простейший markdown: абзацы, списки, **жирный**. HTML из текста не пропускается. */
function render_markdown(?string $source): string
{
    $blocks = preg_split('/\R{2,}/u', trim((string) $source)) ?: [];
    $html = '';
    foreach ($blocks as $block) {
        $lines = array_values(array_filter(array_map('trim', preg_split('/\R/u', $block) ?: [])));
        if (!$lines) {
            continue;
        }
        $isList = true;
        foreach ($lines as $line) {
            if (!preg_match('/^([-*•]|\d+\.)\s+/u', $line)) {
                $isList = false;
                break;
            }
        }
        if ($isList) {
            $tag = preg_match('/^\d+\./', $lines[0]) ? 'ol' : 'ul';
            $html .= "<$tag>";
            foreach ($lines as $line) {
                $html .= '<li>' . inline_markdown(preg_replace('/^([-*•]|\d+\.)\s+/u', '', $line) ?? '') . '</li>';
            }
            $html .= "</$tag>";
            continue;
        }
        $html .= '<p>' . implode('<br/>', array_map('inline_markdown', $lines)) . '</p>';
    }
    return $html;
}

function inline_markdown(string $text): string
{
    $escaped = e($text);
    return preg_replace('/\*\*([^*]+)\*\*/u', '<strong>$1</strong>', $escaped) ?? $escaped;
}

/** Районы Алматы: slug для фильтров, название — то, что хранится и показывается. */
function districts(): array
{
    return [
        'alatau' => 'Алатауский',
        'almaly' => 'Алмалинский',
        'auezov' => 'Ауэзовский',
        'bostandyk' => 'Бостандыкский',
        'zhetysu' => 'Жетысуский',
        'medeu' => 'Медеуский',
        'nauryzbay' => 'Наурызбайский',
        'turksib' => 'Турксибский',
    ];
}

function district_by_slug(string $slug): ?string
{
    return districts()[$slug] ?? null;
}

function district_slug(string $name): ?string
{
    $found = array_search($name, districts(), true);
    return $found === false ? null : (string) $found;
}

function prop_kinds(): array
{
    return ['RETAIL', 'OFFICE', 'WAREHOUSE', 'LAND', 'BUILDING'];
}

function deal_types(): array
{
    return ['RENT', 'SALE', 'BOTH'];
}

function prop_statuses(): array
{
    return ['ACTIVE', 'RESERVED', 'CLOSED', 'HIDDEN'];
}

function lead_statuses(): array
{
    return ['NEW', 'IN_WORK', 'QUALIFIED', 'REJECTED', 'DEAL'];
}

function lead_types(): array
{
    return ['OBJECT', 'SEARCH', 'OWNER', 'CONTACT', 'PRESENTATION'];
}
