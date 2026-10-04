<?php
/**
 * Данные заказчика и редактируемые тексты.
 * Основа — site.json (выгружается из site.config.ts при сборке, один источник правды),
 * поверх неё — то, что заказчик поменял в админке (таблица setting).
 */
declare(strict_types=1);

function site_data(): array
{
    static $data = null;
    if ($data === null) {
        $file = APP_DIR . '/site.json';
        $data = is_file($file) ? (json_decode((string) file_get_contents($file), true) ?: []) : [];
    }
    return $data;
}

function agent(string $key, mixed $default = null): mixed
{
    return site_data()['agent'][$key] ?? $default;
}

function legal(string $key, mixed $default = null): mixed
{
    return site_data()['legal'][$key] ?? $default;
}

/** Контакты: настройки админки поверх значений из конфига. */
function contacts(): array
{
    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }
    $s = setting_get('contacts');
    $pick = static fn(string $key, string $fallbackKey) => filled($s[$key] ?? null) ? (string) $s[$key] : (string) (agent($fallbackKey) ?? '');
    $cached = [
        'phone' => $pick('phone', 'phone'),
        'whatsapp' => $pick('whatsapp', 'whatsapp'),
        'telegram' => $pick('telegram', 'telegram'),
        'instagram' => $pick('instagram', 'instagram'),
        'email' => filled($s['email'] ?? null) ? (string) $s['email'] : (string) (agent('email') ?? ''),
    ];
    return $cached;
}

/** Заголовок и подзаголовок первого экрана: из админки или из словаря. */
function hero_texts(): array
{
    $s = setting_get('hero');
    return [
        'title' => filled($s['title'] ?? null) ? (string) $s['title'] : t('home.hero.title'),
        'subtitle' => filled($s['subtitle'] ?? null) ? (string) $s['subtitle'] : t('home.hero.subtitle'),
    ];
}

/** Четыре показателя полосы цифр. */
function stats_values(): array
{
    $s = setting_get('stats');
    $pick = static fn(string $key, mixed $fallback) => filled($s[$key] ?? null) ? (string) $s[$key] : $fallback;
    return [
        ['value' => (string) $pick('years', (string) (agent('yearsInMarket') ?? '')), 'label' => t('home.stats.years')],
        ['value' => (string) $pick('volume', (string) (agent('closedVolume') ?? '')), 'label' => t('home.stats.volume')],
        ['value' => (string) $pick('objects', (string) (agent('objectsInBase') ?? '')), 'label' => t('home.stats.objects')],
        ['value' => (string) $pick('avgDeal', (string) (agent('avgDealDuration') ?? '')), 'label' => t('home.stats.avgDeal')],
    ];
}

/** Текст блока «Лучшие локации»: из админки или из словаря. */
function locations_text(): string
{
    $s = setting_get('golden');
    return filled($s['text'] ?? null) ? (string) $s['text'] : t('home.locations.text');
}

function whatsapp_url(string $text = ''): string
{
    return whatsapp_link(contacts()['whatsapp'], $text);
}
