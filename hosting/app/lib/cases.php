<?php
/** Кейсы: разбор строк, публичные выборки. */
declare(strict_types=1);

function case_row_to_array(array $r): array
{
    return [
        'id' => $r['id'],
        'slug' => $r['slug'],
        'title' => $r['title'],
        'kind' => $r['kind'],
        'dealType' => $r['deal_type'],
        'district' => $r['district'],
        'areaM2' => $r['area_m2'] === null ? null : (float) $r['area_m2'],
        'amountLabel' => $r['amount_label'],
        'durationLabel' => $r['duration_label'],
        'task' => $r['task'],
        'solution' => $r['solution'],
        'result' => $r['result'],
        'coverUrl' => $r['cover_url'],
        'isFeatured' => (bool) $r['is_featured'],
        'order' => (int) $r['sort_order'],
        'createdAt' => $r['created_at'],
    ];
}

/** Все кейсы для страницы «Кейсы». */
function all_cases(): array
{
    $rows = db()->query('SELECT * FROM case_item ORDER BY is_featured DESC, sort_order ASC, created_at DESC')->fetchAll();
    return array_map('case_row_to_array', $rows);
}

/** Избранные кейсы для главной. */
function featured_cases(int $take = 3): array
{
    $stmt = db()->prepare('SELECT * FROM case_item ORDER BY is_featured DESC, sort_order ASC, created_at DESC LIMIT ?');
    $stmt->bindValue(1, $take, PDO::PARAM_INT);
    $stmt->execute();
    return array_map('case_row_to_array', $stmt->fetchAll());
}

function find_case_by_slug(string $slug): ?array
{
    $stmt = db()->prepare('SELECT * FROM case_item WHERE slug = ?');
    $stmt->execute([$slug]);
    $row = $stmt->fetch();
    return $row ? case_row_to_array($row) : null;
}

function find_case_by_id(string $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM case_item WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? case_row_to_array($row) : null;
}

/** Короткая строка параметров кейса: «Стрит-ритейл · Аренда · 120 м²». */
function case_meta_line(array $c): string
{
    $parts = [kind_label($c['kind']), deal_short($c['dealType'])];
    if (filled($c['district'])) {
        $parts[] = $c['district'];
    }
    if ($c['areaM2'] !== null) {
        $parts[] = fmt_area($c['areaM2']);
    }
    return implode(' · ', $parts);
}

function case_slugs(): array
{
    return db()->query('SELECT slug, created_at FROM case_item ORDER BY sort_order ASC')->fetchAll();
}
