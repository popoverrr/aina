<?php
/**
 * Тексты интерфейса берутся из того же словаря, что и у Next-версии (messages/ru.json),
 * поэтому формулировки на обеих версиях совпадают и правятся в одном месте.
 */
declare(strict_types=1);

function messages(): array
{
    static $data = null;
    if ($data === null) {
        $file = APP_DIR . '/messages.json';
        $data = is_file($file) ? (json_decode((string) file_get_contents($file), true) ?: []) : [];
    }
    return $data;
}

/**
 * t('home.hero.title') — строка из словаря.
 * Подстановки: t('objects.card.imageAlt', ['kind' => 'Офис']) заменяет {kind}.
 */
function t(string $path, array $vars = []): string
{
    $node = messages();
    foreach (explode('.', $path) as $key) {
        if (!is_array($node) || !array_key_exists($key, $node)) {
            return $path;
        }
        $node = $node[$key];
    }
    if (!is_string($node)) {
        return $path;
    }
    foreach ($vars as $k => $v) {
        $node = str_replace('{' . $k . '}', (string) $v, $node);
    }
    return $node;
}

/** Подпись значения перечисления: kind_label('RETAIL') → «Стрит-ритейл». */
function kind_label(string $kind): string
{
    return t('enums.kind.' . $kind);
}

function deal_label(string $deal): string
{
    return t('enums.deal.' . $deal);
}

function deal_short(string $deal): string
{
    return t('enums.dealShort.' . $deal);
}

function status_label(string $status): string
{
    return t('enums.status.' . $status);
}

function lead_type_label(string $type): string
{
    return t('enums.leadType.' . $type);
}

function lead_status_label(string $status): string
{
    return t('enums.leadStatus.' . $status);
}

/** «8 объектов» — plural-строки ICU в словаре PHP не разбирает, склоняем сами. */
function objects_count_label(int $count): string
{
    return $count . ' ' . plural($count, 'объект', 'объекта', 'объектов');
}

function new_leads_label(int $count): string
{
    return $count . ' ' . plural($count, 'новая', 'новые', 'новых');
}
