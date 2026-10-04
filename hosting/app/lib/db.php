<?php
/**
 * SQLite: схема повторяет модель данных из ТЗ (раздел 4) и Prisma-версию сайта.
 * База лежит в app/data/site.db и закрыта от веба отдельным .htaccess.
 * При первом запуске таблицы создаются и наполняются из app/seed.json.
 */
declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        if (!is_dir(DATA_DIR)) {
            mkdir(DATA_DIR, 0775, true);
        }
        $pdo = new PDO('sqlite:' . DATA_DIR . '/site.db', null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA foreign_keys = ON');
    }
    return $pdo;
}

function db_init(): void
{
    $pdo = db();
    $pdo->exec(<<<'SQL'
        CREATE TABLE IF NOT EXISTS property (
            id TEXT PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE,
            external_id TEXT UNIQUE,
            title TEXT NOT NULL,
            kind TEXT NOT NULL,
            deal_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            district TEXT NOT NULL,
            address TEXT,
            landmark TEXT,
            lat REAL,
            lng REAL,
            area_m2 REAL NOT NULL,
            ceiling_m REAL,
            floor TEXT,
            entrance TEXT,
            power_kw REAL,
            has_wet_point INTEGER NOT NULL DEFAULT 0,
            price_sale REAL,
            price_rent_m2 REAL,
            price_rent_total REAL,
            utilities_included INTEGER NOT NULL DEFAULT 0,
            is_exclusive INTEGER NOT NULL DEFAULT 0,
            is_hot INTEGER NOT NULL DEFAULT 0,
            is_featured INTEGER NOT NULL DEFAULT 0,
            description_md TEXT NOT NULL DEFAULT '',
            advantages TEXT NOT NULL DEFAULT '[]',
            presentation_url TEXT,
            published_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS property_kind_deal_status ON property (kind, deal_type, status);
        CREATE INDEX IF NOT EXISTS property_district ON property (district);
        CREATE INDEX IF NOT EXISTS property_hot_featured ON property (is_hot, is_featured);

        CREATE TABLE IF NOT EXISTS property_image (
            id TEXT PRIMARY KEY,
            property_id TEXT NOT NULL REFERENCES property(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            alt TEXT NOT NULL DEFAULT '',
            width INTEGER NOT NULL DEFAULT 0,
            height INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS property_image_order ON property_image (property_id, sort_order);

        CREATE TABLE IF NOT EXISTS case_item (
            id TEXT PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            kind TEXT NOT NULL,
            deal_type TEXT NOT NULL,
            district TEXT,
            area_m2 REAL,
            amount_label TEXT,
            duration_label TEXT,
            task TEXT NOT NULL DEFAULT '',
            solution TEXT NOT NULL DEFAULT '',
            result TEXT NOT NULL DEFAULT '',
            cover_url TEXT,
            is_featured INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lead (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'NEW',
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            comment TEXT,
            property_id TEXT REFERENCES property(id) ON DELETE SET NULL,
            brief_kind TEXT,
            brief_area_from REAL,
            brief_area_to REAL,
            brief_budget TEXT,
            brief_districts TEXT NOT NULL DEFAULT '[]',
            brief_business TEXT,
            utm_source TEXT,
            utm_medium TEXT,
            utm_campaign TEXT,
            utm_content TEXT,
            page_path TEXT,
            referrer TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS lead_status_created ON lead (status, created_at);

        CREATE TABLE IF NOT EXISTS testimonial (
            id TEXT PRIMARY KEY,
            author TEXT NOT NULL,
            role TEXT,
            text TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_public INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS setting (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    SQL);

    db_seed_once();
}

/** Наполнение демо- и реальными данными — только если база пустая. */
function db_seed_once(): void
{
    $pdo = db();
    if ((int) $pdo->query('SELECT COUNT(*) FROM property')->fetchColumn() > 0) {
        return;
    }
    if ((int) $pdo->query('SELECT COUNT(*) FROM case_item')->fetchColumn() > 0) {
        return;
    }
    $file = APP_DIR . '/seed.json';
    if (!is_file($file)) {
        return;
    }
    $seed = json_decode((string) file_get_contents($file), true);
    if (!is_array($seed)) {
        return;
    }
    $now = date('c');

    foreach ($seed['properties'] ?? [] as $p) {
        $id = new_id();
        $stmt = $pdo->prepare('INSERT INTO property (id, slug, external_id, title, kind, deal_type, status, district, address, landmark, lat, lng,
            area_m2, ceiling_m, floor, entrance, power_kw, has_wet_point, price_sale, price_rent_m2, price_rent_total, utilities_included,
            is_exclusive, is_hot, is_featured, description_md, advantages, presentation_url, published_at, created_at, updated_at)
            VALUES (:id,:slug,:external_id,:title,:kind,:deal_type,:status,:district,:address,:landmark,:lat,:lng,
            :area_m2,:ceiling_m,:floor,:entrance,:power_kw,:has_wet_point,:price_sale,:price_rent_m2,:price_rent_total,:utilities_included,
            :is_exclusive,:is_hot,:is_featured,:description_md,:advantages,:presentation_url,:published_at,:created_at,:updated_at)');
        $stmt->execute([
            'id' => $id,
            'slug' => $p['slug'],
            'external_id' => $p['externalId'] ?? null,
            'title' => $p['title'],
            'kind' => $p['kind'],
            'deal_type' => $p['dealType'],
            'status' => $p['status'] ?? 'ACTIVE',
            'district' => $p['district'],
            'address' => $p['address'] ?? null,
            'landmark' => $p['landmark'] ?? null,
            'lat' => $p['lat'] ?? null,
            'lng' => $p['lng'] ?? null,
            'area_m2' => $p['areaM2'],
            'ceiling_m' => $p['ceilingM'] ?? null,
            'floor' => $p['floor'] ?? null,
            'entrance' => $p['entrance'] ?? null,
            'power_kw' => $p['powerKw'] ?? null,
            'has_wet_point' => !empty($p['hasWetPoint']) ? 1 : 0,
            'price_sale' => $p['priceSale'] ?? null,
            'price_rent_m2' => $p['priceRentM2'] ?? null,
            'price_rent_total' => $p['priceRentTotal'] ?? null,
            'utilities_included' => !empty($p['utilitiesIncluded']) ? 1 : 0,
            'is_exclusive' => !empty($p['isExclusive']) ? 1 : 0,
            'is_hot' => !empty($p['isHot']) ? 1 : 0,
            'is_featured' => !empty($p['isFeatured']) ? 1 : 0,
            'description_md' => $p['descriptionMd'] ?? '',
            'advantages' => json_encode($p['advantages'] ?? [], JSON_UNESCAPED_UNICODE),
            'presentation_url' => $p['presentationUrl'] ?? null,
            'published_at' => $p['publishedAt'] ?? $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    foreach ($seed['cases'] ?? [] as $c) {
        $stmt = $pdo->prepare('INSERT INTO case_item (id, slug, title, kind, deal_type, district, area_m2, amount_label, duration_label,
            task, solution, result, cover_url, is_featured, sort_order, created_at)
            VALUES (:id,:slug,:title,:kind,:deal_type,:district,:area_m2,:amount_label,:duration_label,
            :task,:solution,:result,:cover_url,:is_featured,:sort_order,:created_at)');
        $stmt->execute([
            'id' => new_id(),
            'slug' => $c['slug'],
            'title' => $c['title'],
            'kind' => $c['kind'],
            'deal_type' => $c['dealType'],
            'district' => $c['district'] ?? null,
            'area_m2' => $c['areaM2'] ?? null,
            'amount_label' => $c['amountLabel'] ?? null,
            'duration_label' => $c['durationLabel'] ?? null,
            'task' => $c['task'] ?? '',
            'solution' => $c['solution'] ?? '',
            'result' => $c['result'] ?? '',
            'cover_url' => $c['coverUrl'] ?? null,
            'is_featured' => !empty($c['isFeatured']) ? 1 : 0,
            'sort_order' => (int) ($c['order'] ?? 0),
            'created_at' => $now,
        ]);
    }

    foreach ($seed['testimonials'] ?? [] as $tItem) {
        $stmt = $pdo->prepare('INSERT INTO testimonial (id, author, role, text, sort_order, is_public) VALUES (:id,:author,:role,:text,:sort_order,:is_public)');
        $stmt->execute([
            'id' => new_id(),
            'author' => $tItem['author'],
            'role' => $tItem['role'] ?? null,
            'text' => $tItem['text'],
            'sort_order' => (int) ($tItem['order'] ?? 0),
            'is_public' => isset($tItem['isPublic']) && !$tItem['isPublic'] ? 0 : 1,
        ]);
    }
}

/** Значение настройки (JSON-объект). */
function setting_get(string $key): array
{
    $row = db()->prepare('SELECT value FROM setting WHERE key = ?');
    $row->execute([$key]);
    $raw = $row->fetchColumn();
    if (!is_string($raw)) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function setting_set(string $key, array $value): void
{
    $stmt = db()->prepare('INSERT INTO setting (key, value) VALUES (:key, :value) ON CONFLICT(key) DO UPDATE SET value = :value');
    $stmt->execute(['key' => $key, 'value' => json_encode($value, JSON_UNESCAPED_UNICODE)]);
}
