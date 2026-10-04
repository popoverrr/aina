<?php
/**
 * Единственное место форматирования чисел, цен, площадей и телефонов.
 * Повторяет lib/format.ts из Next-версии, чтобы вид был тот же.
 */
declare(strict_types=1);

const NBSP = "\u{00A0}";

/** Разряды неразрывным пробелом: 12 500 000 */
function fmt_number(float $value, int $fractionDigits = 0): string
{
    $fixed = number_format(abs($value), $fractionDigits, ',', NBSP);
    return ($value < 0 ? '−' : '') . $fixed;
}

/** Цена в тенге: «12 500 000 ₸». null — пустая строка, решение принимает вызывающий. */
function fmt_price(?float $value, string $suffix = ''): string
{
    if ($value === null) {
        return '';
    }
    return fmt_number($value) . NBSP . '₸' . $suffix;
}

function fmt_price_m2(?float $value): string
{
    return fmt_price($value, '/м²');
}

/** Площадь: «120 м²», дробные — до одного знака. */
function fmt_area(?float $m2): string
{
    if ($m2 === null) {
        return '';
    }
    $digits = floor($m2) === $m2 ? 0 : 1;
    return fmt_number($m2, $digits) . NBSP . 'м²';
}

/** Диапазон площади для закрытых объектов: «100–150 м²». */
function fmt_area_range(float $m2): string
{
    $step = $m2 < 100 ? 10 : ($m2 < 500 ? 50 : 100);
    $from = floor($m2 / $step) * $step;
    return fmt_number($from) . '–' . fmt_number($from + $step) . NBSP . 'м²';
}

function fmt_date(?string $iso, bool $withTime = false): string
{
    if (!filled($iso)) {
        return '';
    }
    $ts = strtotime((string) $iso);
    if ($ts === false) {
        return '';
    }
    return date($withTime ? 'd.m.Y, H:i' : 'd.m.Y', $ts);
}

/** Телефон в виде +7 701 085 77 17 из любого формата. */
function fmt_phone(string $phone): string
{
    $digits = preg_replace('/\D/', '', $phone) ?? '';
    if (strlen($digits) === 11 && str_starts_with($digits, '7')) {
        return '+7' . NBSP . substr($digits, 1, 3) . NBSP . substr($digits, 4, 3) . NBSP . substr($digits, 7, 2) . NBSP . substr($digits, 9, 2);
    }
    return str_starts_with($phone, '+') ? $phone : '+' . $digits;
}

/** Нормализация телефона к +77010857717. null — номер не распознан. */
function normalize_phone(string $raw): ?string
{
    $digits = preg_replace('/\D/', '', $raw) ?? '';
    if ($digits === '') {
        return null;
    }
    if (strlen($digits) === 11 && str_starts_with($digits, '8')) {
        return '+7' . substr($digits, 1);
    }
    if (strlen($digits) === 11 && str_starts_with($digits, '7')) {
        return '+' . $digits;
    }
    if (strlen($digits) === 10 && str_starts_with($digits, '7')) {
        return '+7' . $digits;
    }
    if (strlen($digits) >= 10 && strlen($digits) <= 15) {
        return '+' . $digits;
    }
    return null;
}

/** Склонение: 1 объект, 2 объекта, 5 объектов. */
function plural(int $n, string $one, string $few, string $many): string
{
    $mod10 = $n % 10;
    $mod100 = $n % 100;
    if ($mod10 === 1 && $mod100 !== 11) {
        return $one;
    }
    if ($mod10 >= 2 && $mod10 <= 4 && ($mod100 < 12 || $mod100 > 14)) {
        return $few;
    }
    return $many;
}

function whatsapp_link(string $number, string $text = ''): string
{
    $base = 'https://wa.me/' . preg_replace('/\D/', '', $number);
    return $text === '' ? $base : $base . '?text=' . rawurlencode($text);
}

function telegram_link(string $value): string
{
    if (preg_match('#^https?://#i', $value)) {
        return $value;
    }
    return 'https://t.me/' . ltrim($value, '@');
}

/** Username для показа или null, если ссылка по номеру телефона. */
function telegram_handle(string $value): ?string
{
    $name = preg_replace('#^https?://(?:t\.me|telegram\.me)/#i', '', $value) ?? $value;
    $name = rtrim(ltrim($name, '@'), '/');
    return preg_match('/^[A-Za-z][A-Za-z0-9_]{3,}$/', $name) ? $name : null;
}

function instagram_link(string $username): string
{
    return 'https://instagram.com/' . ltrim($username, '@');
}

function phone_href(string $phone): string
{
    return 'tel:' . (preg_replace('/[^\d+]/', '', $phone) ?? '');
}
