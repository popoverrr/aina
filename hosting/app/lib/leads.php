<?php
/**
 * Заявки: проверка полей, запись в базу, антиспам.
 * Коды ошибок совпадают с ключами forms.errors.* в словаре — тексты в одном месте.
 */
declare(strict_types=1);

const LEAD_MIN_SECONDS = 2;

/**
 * Проверка данных формы. Возвращает ['errors' => [поле => код], 'data' => [...]].
 */
function validate_lead(string $type, array $src): array
{
    $errors = [];
    $name = trim((string) ($src['name'] ?? ''));
    $phoneRaw = trim((string) ($src['phone'] ?? ''));
    $comment = trim((string) ($src['comment'] ?? ''));

    if (mb_strlen($name) < 2) {
        $errors['name'] = 'nameShort';
    } elseif (mb_strlen($name) > 80) {
        $errors['name'] = 'nameLong';
    }

    $phone = normalize_phone($phoneRaw);
    if ($phone === null) {
        $errors['phone'] = 'phoneInvalid';
    }

    if (mb_strlen($comment) > 1000) {
        $errors['comment'] = 'commentLong';
    }

    $areaFrom = lead_num($src['areaFrom'] ?? null);
    $areaTo = lead_num($src['areaTo'] ?? null);
    if ($areaFrom !== null && $areaTo !== null && $areaFrom > $areaTo) {
        $errors['areaTo'] = 'areaRange';
    }

    $districtNames = [];
    foreach ((array) ($src['districts'] ?? []) as $d) {
        if (!is_string($d)) {
            continue;
        }
        $resolved = district_by_slug($d) ?? (in_array($d, districts(), true) ? $d : null);
        if ($resolved !== null) {
            $districtNames[] = $resolved;
        }
    }

    $propertyId = null;
    if (filled($src['propertyId'] ?? null)) {
        $found = find_property_by_id((string) $src['propertyId']);
        $propertyId = $found['id'] ?? null;
    }

    $briefKind = in_array($src['briefKind'] ?? null, prop_kinds(), true) ? (string) $src['briefKind'] : null;

    return [
        'errors' => $errors,
        'data' => [
            'type' => in_array($type, lead_types(), true) ? $type : 'CONTACT',
            'name' => $name,
            'phone' => $phone ?? $phoneRaw,
            'comment' => $comment === '' ? null : $comment,
            'propertyId' => $propertyId,
            'briefKind' => $briefKind,
            'briefAreaFrom' => $areaFrom,
            'briefAreaTo' => $areaTo,
            'briefBudget' => filled($src['budget'] ?? null) ? mb_substr((string) $src['budget'], 0, 120) : null,
            'briefDistricts' => $districtNames,
            'briefBusiness' => filled($src['business'] ?? null) ? mb_substr((string) $src['business'], 0, 200) : null,
        ],
    ];
}

function lead_num(mixed $v): ?float
{
    if (!filled($v)) {
        return null;
    }
    $clean = str_replace([' ', ',', NBSP], ['', '.', ''], (string) $v);
    return is_numeric($clean) && (float) $clean >= 0 ? (float) $clean : null;
}

/**
 * Антиспам без капчи: скрытое поле (honeypot) и минимальное время заполнения.
 * Возвращает true, если заявку надо тихо отбросить.
 */
function lead_is_spam(array $src): bool
{
    if (filled($src['website'] ?? null)) {
        return true;
    }
    $startedAt = (int) ($src['startedAt'] ?? 0);
    return $startedAt > 0 && (time() - intdiv($startedAt, 1000)) < LEAD_MIN_SECONDS;
}

/** Запись заявки. Возвращает её идентификатор. */
function create_lead(array $data, array $meta = []): string
{
    $id = new_id();
    $stmt = db()->prepare('INSERT INTO lead (id, type, status, name, phone, comment, property_id, brief_kind, brief_area_from, brief_area_to,
        brief_budget, brief_districts, brief_business, utm_source, utm_medium, utm_campaign, utm_content, page_path, referrer, created_at)
        VALUES (:id, :type, :status, :name, :phone, :comment, :property_id, :brief_kind, :brief_area_from, :brief_area_to,
        :brief_budget, :brief_districts, :brief_business, :utm_source, :utm_medium, :utm_campaign, :utm_content, :page_path, :referrer, :created_at)');
    $stmt->execute([
        'id' => $id,
        'type' => $data['type'],
        'status' => 'NEW',
        'name' => $data['name'],
        'phone' => $data['phone'],
        'comment' => $data['comment'],
        'property_id' => $data['propertyId'],
        'brief_kind' => $data['briefKind'],
        'brief_area_from' => $data['briefAreaFrom'],
        'brief_area_to' => $data['briefAreaTo'],
        'brief_budget' => $data['briefBudget'],
        'brief_districts' => json_encode($data['briefDistricts'] ?? [], JSON_UNESCAPED_UNICODE),
        'brief_business' => $data['briefBusiness'],
        'utm_source' => $meta['utm_source'] ?? null,
        'utm_medium' => $meta['utm_medium'] ?? null,
        'utm_campaign' => $meta['utm_campaign'] ?? null,
        'utm_content' => $meta['utm_content'] ?? null,
        'page_path' => $meta['page_path'] ?? null,
        'referrer' => $meta['referrer'] ?? null,
        'created_at' => date('c'),
    ]);
    return $id;
}

/** Метки источника из формы и заголовков запроса. */
function lead_meta(array $src): array
{
    $cut = static fn(mixed $v) => filled($v) ? mb_substr((string) $v, 0, 200) : null;
    return [
        'utm_source' => $cut($src['utm_source'] ?? null),
        'utm_medium' => $cut($src['utm_medium'] ?? null),
        'utm_campaign' => $cut($src['utm_campaign'] ?? null),
        'utm_content' => $cut($src['utm_content'] ?? null),
        'page_path' => $cut($src['pagePath'] ?? ($_SERVER['REQUEST_URI'] ?? null)),
        'referrer' => $cut($src['referrer'] ?? ($_SERVER['HTTP_REFERER'] ?? null)),
    ];
}

function lead_row_to_array(array $r): array
{
    return [
        'id' => $r['id'],
        'type' => $r['type'],
        'status' => $r['status'],
        'name' => $r['name'],
        'phone' => $r['phone'],
        'comment' => $r['comment'],
        'propertyId' => $r['property_id'],
        'propertyTitle' => $r['property_title'] ?? null,
        'propertySlug' => $r['property_slug'] ?? null,
        'briefKind' => $r['brief_kind'],
        'briefAreaFrom' => $r['brief_area_from'] === null ? null : (float) $r['brief_area_from'],
        'briefAreaTo' => $r['brief_area_to'] === null ? null : (float) $r['brief_area_to'],
        'briefBudget' => $r['brief_budget'],
        'briefDistricts' => json_decode((string) $r['brief_districts'], true) ?: [],
        'briefBusiness' => $r['brief_business'],
        'utm' => array_filter([
            'source' => $r['utm_source'],
            'medium' => $r['utm_medium'],
            'campaign' => $r['utm_campaign'],
            'content' => $r['utm_content'],
        ], 'filled'),
        'pagePath' => $r['page_path'],
        'referrer' => $r['referrer'],
        'createdAt' => $r['created_at'],
    ];
}

/** Список заявок для панели с фильтром по статусу и типу. */
function list_leads(?string $status = null, ?string $type = null, int $limit = 300): array
{
    $where = [];
    $args = [];
    if ($status !== null && in_array($status, lead_statuses(), true)) {
        $where[] = 'l.status = ?';
        $args[] = $status;
    }
    if ($type !== null && in_array($type, lead_types(), true)) {
        $where[] = 'l.type = ?';
        $args[] = $type;
    }
    $sql = 'SELECT l.*, p.title AS property_title, p.slug AS property_slug FROM lead l LEFT JOIN property p ON p.id = l.property_id'
        . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
        . ' ORDER BY l.created_at DESC LIMIT ' . (int) $limit;
    $stmt = db()->prepare($sql);
    $stmt->execute($args);
    return array_map('lead_row_to_array', $stmt->fetchAll());
}

function count_new_leads(): int
{
    return (int) db()->query("SELECT COUNT(*) FROM lead WHERE status = 'NEW'")->fetchColumn();
}

function set_lead_status(string $id, string $status): void
{
    if (!in_array($status, lead_statuses(), true)) {
        return;
    }
    db()->prepare('UPDATE lead SET status = ? WHERE id = ?')->execute([$status, $id]);
}

function delete_lead(string $id): void
{
    db()->prepare('DELETE FROM lead WHERE id = ?')->execute([$id]);
}

/** Выгрузка заявок в CSV для Excel: разделитель — точка с запятой, BOM для кириллицы. */
function leads_csv(array $leads): string
{
    $out = fopen('php://temp', 'r+');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, [
        'Дата', 'Тип', 'Статус', 'Имя', 'Телефон', 'Объект', 'Комментарий', 'Тип помещения',
        'Площадь от', 'Площадь до', 'Бюджет', 'Районы', 'Бизнес',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'Страница',
    ], ';');
    foreach ($leads as $l) {
        fputcsv($out, [
            fmt_date($l['createdAt'], true),
            lead_type_label($l['type']),
            lead_status_label($l['status']),
            $l['name'],
            $l['phone'],
            $l['propertyTitle'] ?? '',
            $l['comment'] ?? '',
            $l['briefKind'] ? kind_label($l['briefKind']) : '',
            $l['briefAreaFrom'] ?? '',
            $l['briefAreaTo'] ?? '',
            $l['briefBudget'] ?? '',
            implode(', ', $l['briefDistricts']),
            $l['briefBusiness'] ?? '',
            $l['utm']['source'] ?? '',
            $l['utm']['medium'] ?? '',
            $l['utm']['campaign'] ?? '',
            $l['utm']['content'] ?? '',
            $l['pagePath'] ?? '',
        ], ';');
    }
    rewind($out);
    return (string) stream_get_contents($out);
}
