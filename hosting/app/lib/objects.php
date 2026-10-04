<?php
/**
 * Объекты: публичные выборки и фильтры каталога.
 *
 * Правило закрытых объектов (is_exclusive): точный адрес, координаты, полная цена,
 * презентация и все фото кроме обложки отдаются только после заявки по этому объекту.
 * Отсечение делает public_property() — в разметку эти поля не попадают вообще.
 */
declare(strict_types=1);

const PUBLIC_STATUSES = ['ACTIVE', 'RESERVED'];
const PAGE_SIZE = 12;

function property_row_to_array(array $r): array
{
    return [
        'id' => $r['id'],
        'slug' => $r['slug'],
        'externalId' => $r['external_id'],
        'title' => $r['title'],
        'kind' => $r['kind'],
        'dealType' => $r['deal_type'],
        'status' => $r['status'],
        'district' => $r['district'],
        'address' => $r['address'],
        'landmark' => $r['landmark'],
        'lat' => $r['lat'] === null ? null : (float) $r['lat'],
        'lng' => $r['lng'] === null ? null : (float) $r['lng'],
        'areaM2' => (float) $r['area_m2'],
        'ceilingM' => $r['ceiling_m'] === null ? null : (float) $r['ceiling_m'],
        'floor' => $r['floor'],
        'entrance' => $r['entrance'],
        'powerKw' => $r['power_kw'] === null ? null : (float) $r['power_kw'],
        'hasWetPoint' => (bool) $r['has_wet_point'],
        'priceSale' => $r['price_sale'] === null ? null : (float) $r['price_sale'],
        'priceRentM2' => $r['price_rent_m2'] === null ? null : (float) $r['price_rent_m2'],
        'priceRentTotal' => $r['price_rent_total'] === null ? null : (float) $r['price_rent_total'],
        'utilitiesIncluded' => (bool) $r['utilities_included'],
        'isExclusive' => (bool) $r['is_exclusive'],
        'isHot' => (bool) $r['is_hot'],
        'isFeatured' => (bool) $r['is_featured'],
        'descriptionMd' => $r['description_md'],
        'advantages' => json_decode((string) $r['advantages'], true) ?: [],
        'presentationUrl' => $r['presentation_url'],
        'publishedAt' => $r['published_at'],
        'createdAt' => $r['created_at'],
        'updatedAt' => $r['updated_at'],
    ];
}

function property_images(string $propertyId): array
{
    $stmt = db()->prepare('SELECT url, alt, width, height FROM property_image WHERE property_id = ? ORDER BY sort_order ASC');
    $stmt->execute([$propertyId]);
    return $stmt->fetchAll();
}

/**
 * Очистка под публичный показ. Для закрытого объекта без unlocked остаётся только разрешённое.
 */
function public_property(array $p, bool $unlocked = false): array
{
    $images = property_images($p['id']);
    $cover = $images[0] ?? null;
    $restricted = $p['isExclusive'] && !$unlocked;

    return [
        'id' => $p['id'],
        'slug' => $p['slug'],
        'title' => $p['title'],
        'kind' => $p['kind'],
        'dealType' => $p['dealType'],
        'status' => $p['status'],
        'district' => $p['district'],
        'landmark' => $p['landmark'],
        'isExclusive' => $p['isExclusive'],
        'isHot' => $p['isHot'],
        'isFeatured' => $p['isFeatured'],
        'areaM2' => $restricted ? null : $p['areaM2'],
        'areaLabel' => $restricted ? fmt_area_range($p['areaM2']) : fmt_area($p['areaM2']),
        'priceSale' => $restricted ? null : $p['priceSale'],
        'priceRentM2' => $restricted ? null : $p['priceRentM2'],
        'priceRentTotal' => $restricted ? null : $p['priceRentTotal'],
        'advantages' => $p['advantages'],
        'address' => $restricted ? null : $p['address'],
        'lat' => $restricted ? null : $p['lat'],
        'lng' => $restricted ? null : $p['lng'],
        'ceilingM' => $p['ceilingM'],
        'floor' => $p['floor'],
        'entrance' => $p['entrance'],
        'powerKw' => $p['powerKw'],
        'hasWetPoint' => $p['hasWetPoint'],
        'utilitiesIncluded' => $p['utilitiesIncluded'],
        'descriptionMd' => $p['descriptionMd'],
        'presentationUrl' => $restricted ? null : $p['presentationUrl'],
        'images' => $restricted ? ($cover ? [$cover] : []) : $images,
        'cover' => $cover,
        'unlocked' => $p['isExclusive'] ? $unlocked : true,
        'updatedAt' => $p['updatedAt'],
    ];
}

function find_property_by_slug(string $slug): ?array
{
    $stmt = db()->prepare('SELECT * FROM property WHERE slug = ? AND status IN (\'ACTIVE\',\'RESERVED\')');
    $stmt->execute([$slug]);
    $row = $stmt->fetch();
    return $row ? property_row_to_array($row) : null;
}

function find_property_by_id(string $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM property WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? property_row_to_array($row) : null;
}

/** Горящие варианты для главной. */
function hot_properties(int $take = 3): array
{
    $stmt = db()->prepare('SELECT * FROM property WHERE is_hot = 1 AND status = \'ACTIVE\' ORDER BY updated_at DESC LIMIT ?');
    $stmt->bindValue(1, $take, PDO::PARAM_INT);
    $stmt->execute();
    return array_map(static fn(array $r) => public_property(property_row_to_array($r)), $stmt->fetchAll());
}

/** Похожие объекты того же типа. */
function similar_properties(string $kind, ?string $excludeId, int $take = 3): array
{
    $sql = 'SELECT * FROM property WHERE kind = ? AND status = \'ACTIVE\'' . ($excludeId ? ' AND id <> ?' : '') . ' ORDER BY is_hot DESC, updated_at DESC LIMIT ?';
    $stmt = db()->prepare($sql);
    $i = 1;
    $stmt->bindValue($i++, $kind);
    if ($excludeId) {
        $stmt->bindValue($i++, $excludeId);
    }
    $stmt->bindValue($i, $take, PDO::PARAM_INT);
    $stmt->execute();
    return array_map(static fn(array $r) => public_property(property_row_to_array($r)), $stmt->fetchAll());
}

/** Разбор фильтров каталога из строки запроса. */
function parse_filters(array $query): array
{
    $num = static function (?string $v): ?float {
        if (!filled($v)) {
            return null;
        }
        $clean = str_replace([' ', ','], ['', '.'], (string) $v);
        return is_numeric($clean) && (float) $clean >= 0 ? (float) $clean : null;
    };
    $deal = $query['deal'] ?? null;
    $kind = $query['kind'] ?? null;
    $districtsRaw = $query['district'] ?? '';
    $districtSlugs = array_values(array_filter(array_map('trim', explode(',', is_string($districtsRaw) ? $districtsRaw : '')), static fn($d) => $d !== '' && district_by_slug($d) !== null));
    $sort = $query['sort'] ?? 'hot';
    $limitRaw = $num($query['limit'] ?? null);
    $limit = $limitRaw === null ? PAGE_SIZE : (int) (floor($limitRaw / PAGE_SIZE) * PAGE_SIZE);

    return [
        'deal' => in_array($deal, ['RENT', 'SALE'], true) ? $deal : null,
        'kind' => in_array($kind, prop_kinds(), true) ? $kind : null,
        'districts' => $districtSlugs,
        'areaFrom' => $num($query['areaFrom'] ?? null),
        'areaTo' => $num($query['areaTo'] ?? null),
        'priceFrom' => $num($query['priceFrom'] ?? null),
        'priceTo' => $num($query['priceTo'] ?? null),
        'hot' => ($query['hot'] ?? '') === '1',
        'firstLine' => ($query['firstLine'] ?? '') === '1',
        'sort' => in_array($sort, ['hot', 'price_asc', 'price_desc', 'area_desc', 'date'], true) ? $sort : 'hot',
        'limit' => max(PAGE_SIZE, min($limit, PAGE_SIZE * 20)),
    ];
}

function filters_are_active(array $f): bool
{
    return $f['deal'] !== null || $f['kind'] !== null || $f['districts'] !== [] || $f['areaFrom'] !== null || $f['areaTo'] !== null
        || $f['priceFrom'] !== null || $f['priceTo'] !== null || $f['hot'] || $f['firstLine'] || $f['sort'] !== 'hot' || $f['limit'] > PAGE_SIZE;
}

/** Каталог: выборка по фильтрам и общее количество. */
function search_properties(array $f): array
{
    $where = ["status IN ('ACTIVE','RESERVED')"];
    $args = [];

    if ($f['deal'] !== null) {
        $where[] = 'deal_type IN (?, \'BOTH\')';
        $args[] = $f['deal'];
    }
    if ($f['kind'] !== null) {
        $where[] = 'kind = ?';
        $args[] = $f['kind'];
    }
    if ($f['districts']) {
        $names = array_map(static fn(string $s) => district_by_slug($s), $f['districts']);
        $where[] = 'district IN (' . implode(',', array_fill(0, count($names), '?')) . ')';
        array_push($args, ...$names);
    }
    if ($f['areaFrom'] !== null) {
        $where[] = 'area_m2 >= ?';
        $args[] = $f['areaFrom'];
    }
    if ($f['areaTo'] !== null) {
        $where[] = 'area_m2 <= ?';
        $args[] = $f['areaTo'];
    }
    if ($f['priceFrom'] !== null || $f['priceTo'] !== null) {
        // Для аренды сравниваем месячную ставку, для продажи — стоимость; без выбора сделки — любое из двух.
        $cols = $f['deal'] === 'SALE' ? ['price_sale'] : ($f['deal'] === 'RENT' ? ['price_rent_total'] : ['price_rent_total', 'price_sale']);
        $parts = [];
        foreach ($cols as $col) {
            $cond = ["$col IS NOT NULL"];
            if ($f['priceFrom'] !== null) {
                $cond[] = "$col >= ?";
                $args[] = $f['priceFrom'];
            }
            if ($f['priceTo'] !== null) {
                $cond[] = "$col <= ?";
                $args[] = $f['priceTo'];
            }
            $parts[] = '(' . implode(' AND ', $cond) . ')';
        }
        $where[] = '(' . implode(' OR ', $parts) . ')';
    }
    if ($f['hot']) {
        $where[] = 'is_hot = 1';
    }
    if ($f['firstLine']) {
        // «Первая линия» — по заполненному описанию входа: отдельного флага в модели нет.
        $where[] = "entrance IS NOT NULL AND entrance <> ''";
    }

    $priceCol = $f['deal'] === 'SALE' ? 'price_sale' : 'price_rent_total';
    $order = match ($f['sort']) {
        'price_asc' => "$priceCol IS NULL, $priceCol ASC, updated_at DESC",
        'price_desc' => "$priceCol IS NULL, $priceCol DESC, updated_at DESC",
        'area_desc' => 'area_m2 DESC, updated_at DESC',
        'date' => 'published_at IS NULL, published_at DESC, created_at DESC',
        default => 'is_hot DESC, updated_at DESC',
    };

    $sqlWhere = implode(' AND ', $where);
    $countStmt = db()->prepare("SELECT COUNT(*) FROM property WHERE $sqlWhere");
    $countStmt->execute($args);
    $total = (int) $countStmt->fetchColumn();

    $stmt = db()->prepare("SELECT * FROM property WHERE $sqlWhere ORDER BY $order LIMIT " . (int) $f['limit']);
    $stmt->execute($args);
    $items = array_map(static fn(array $r) => public_property(property_row_to_array($r)), $stmt->fetchAll());

    return ['items' => $items, 'total' => $total];
}

/** Все публичные адреса объектов — для карты сайта. */
function public_property_slugs(): array
{
    return db()->query('SELECT slug, updated_at FROM property WHERE status IN (\'ACTIVE\',\'RESERVED\') ORDER BY updated_at DESC')->fetchAll();
}

/**
 * Подтверждение заявки по закрытому объекту хранится в подписанной cookie:
 * подделать без ключа нельзя, а сервер не держит лишнего состояния.
 */
function unlock_secret(): string
{
    $file = DATA_DIR . '/unlock.key';
    if (!is_file($file)) {
        file_put_contents($file, bin2hex(random_bytes(32)));
        @chmod($file, 0640);
    }
    return trim((string) file_get_contents($file));
}

function unlock_sign(string $propertyId): string
{
    return hash_hmac('sha256', $propertyId, unlock_secret());
}

function is_property_unlocked(string $propertyId): bool
{
    $raw = $_COOKIE['ayna_unlock'] ?? '';
    $entries = json_decode((string) $raw, true);
    if (!is_array($entries)) {
        return false;
    }
    foreach ($entries as $entry) {
        if (($entry['id'] ?? null) === $propertyId && hash_equals(unlock_sign($propertyId), (string) ($entry['s'] ?? ''))) {
            return true;
        }
    }
    return false;
}

function unlock_property(string $propertyId): void
{
    $raw = $_COOKIE['ayna_unlock'] ?? '';
    $entries = json_decode((string) $raw, true);
    $entries = is_array($entries) ? array_values(array_filter($entries, static fn($e) => ($e['id'] ?? null) !== $propertyId)) : [];
    $entries[] = ['id' => $propertyId, 's' => unlock_sign($propertyId)];
    $entries = array_slice($entries, -20);
    setcookie('ayna_unlock', json_encode($entries), [
        'expires' => time() + 30 * 24 * 3600,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}
