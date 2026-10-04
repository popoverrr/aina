<?php
/** Отзывы. Показываются только отмеченные как публичные; пустой список — секции нет вообще. */
declare(strict_types=1);

function testimonial_row_to_array(array $r): array
{
    return [
        'id' => $r['id'],
        'author' => $r['author'],
        'role' => $r['role'],
        'text' => $r['text'],
        'order' => (int) $r['sort_order'],
        'isPublic' => (bool) $r['is_public'],
    ];
}

function public_testimonials(): array
{
    $rows = db()->query('SELECT * FROM testimonial WHERE is_public = 1 ORDER BY sort_order ASC')->fetchAll();
    return array_map('testimonial_row_to_array', $rows);
}

function all_testimonials(): array
{
    $rows = db()->query('SELECT * FROM testimonial ORDER BY sort_order ASC')->fetchAll();
    return array_map('testimonial_row_to_array', $rows);
}

function find_testimonial(string $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM testimonial WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? testimonial_row_to_array($row) : null;
}
