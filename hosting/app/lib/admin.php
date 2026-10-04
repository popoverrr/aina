<?php
/**
 * Запись данных из панели: объекты, кейсы, отзывы.
 * Всё, что приходит из формы, проходит через эти функции — валидация в одном месте.
 */
declare(strict_types=1);

/** Данные объекта из формы. Возвращает ['errors' => [...], 'data' => [...]]. */
function collect_property_form(?string $currentId = null): array
{
    $errors = [];
    $title = post('title');
    if (mb_strlen($title) < 3) {
        $errors['title'] = 'Укажите название объекта';
    }

    $slug = post('slug') !== '' ? slugify(post('slug')) : slugify($title);
    if ($slug === '' || !is_valid_slug($slug)) {
        $errors['slug'] = 'Адрес страницы: латиница, цифры и дефис';
    } else {
        $stmt = db()->prepare('SELECT id FROM property WHERE slug = ?' . ($currentId ? ' AND id <> ?' : ''));
        $stmt->execute($currentId ? [$slug, $currentId] : [$slug]);
        if ($stmt->fetchColumn()) {
            $errors['slug'] = 'Такой адрес страницы уже занят';
        }
    }

    $kind = post('kind');
    if (!in_array($kind, prop_kinds(), true)) {
        $errors['kind'] = 'Выберите тип помещения';
    }
    $dealType = post('dealType');
    if (!in_array($dealType, deal_types(), true)) {
        $errors['dealType'] = 'Выберите тип сделки';
    }
    $status = in_array(post('status'), prop_statuses(), true) ? post('status') : 'ACTIVE';

    $district = post('district');
    if (district_slug($district) === null && district_by_slug($district) === null) {
        $errors['district'] = 'Выберите район';
    } else {
        $district = district_by_slug($district) ?? $district;
    }

    $area = post_num('areaM2');
    if ($area === null || $area <= 0) {
        $errors['areaM2'] = 'Укажите площадь в м²';
    }

    $priceSale = post_num('priceSale');
    $priceRentM2 = post_num('priceRentM2');
    $priceRentTotal = post_num('priceRentTotal');
    // Ставку за м² и месячную сумму достаточно задать одну — вторую считаем сами.
    if ($dealType !== 'SALE' && $area !== null && $area > 0) {
        if ($priceRentTotal === null && $priceRentM2 !== null) {
            $priceRentTotal = round($priceRentM2 * $area);
        } elseif ($priceRentM2 === null && $priceRentTotal !== null) {
            $priceRentM2 = round($priceRentTotal / $area);
        }
    }
    if ($dealType === 'SALE' && $priceSale === null) {
        $errors['priceSale'] = 'Укажите цену продажи';
    }
    if ($dealType === 'RENT' && $priceRentTotal === null) {
        $errors['priceRentTotal'] = 'Укажите ставку аренды';
    }

    $advantages = array_values(array_filter(array_map('trim', preg_split('/\R/u', post('advantages')) ?: []), static fn($s) => $s !== ''));

    $presentation = post('presentationUrl');
    if ($presentation !== '' && !preg_match('#^(https?://|/uploads/)#i', $presentation)) {
        $errors['presentationUrl'] = 'Ссылка должна начинаться с http:// или https://';
    }

    return [
        'errors' => $errors,
        'data' => [
            'slug' => $slug,
            'external_id' => post('externalId') !== '' ? post('externalId') : null,
            'title' => $title,
            'kind' => $kind,
            'deal_type' => $dealType,
            'status' => $status,
            'district' => $district,
            'address' => post('address') !== '' ? post('address') : null,
            'landmark' => post('landmark') !== '' ? post('landmark') : null,
            'lat' => post_num('lat'),
            'lng' => post_num('lng'),
            'area_m2' => $area ?? 0.0,
            'ceiling_m' => post_num('ceilingM'),
            'floor' => post('floor') !== '' ? post('floor') : null,
            'entrance' => post('entrance') !== '' ? post('entrance') : null,
            'power_kw' => post_num('powerKw'),
            'has_wet_point' => post_bool('hasWetPoint') ? 1 : 0,
            'price_sale' => $priceSale,
            'price_rent_m2' => $priceRentM2,
            'price_rent_total' => $priceRentTotal,
            'utilities_included' => post_bool('utilitiesIncluded') ? 1 : 0,
            'is_exclusive' => post_bool('isExclusive') ? 1 : 0,
            'is_hot' => post_bool('isHot') ? 1 : 0,
            'is_featured' => post_bool('isFeatured') ? 1 : 0,
            'description_md' => post('descriptionMd'),
            'advantages' => json_encode($advantages, JSON_UNESCAPED_UNICODE),
            'presentation_url' => $presentation !== '' ? $presentation : null,
        ],
    ];
}

function insert_property(array $d): string
{
    $id = new_id();
    $now = date('c');
    $cols = array_keys($d);
    $sql = 'INSERT INTO property (id, ' . implode(', ', $cols) . ', published_at, created_at, updated_at) VALUES (:id, :'
        . implode(', :', $cols) . ', :published_at, :created_at, :updated_at)';
    $stmt = db()->prepare($sql);
    $stmt->execute($d + [
        'id' => $id,
        'published_at' => $d['status'] === 'ACTIVE' ? $now : null,
        'created_at' => $now,
        'updated_at' => $now,
    ]);
    return $id;
}

function update_property(string $id, array $d): void
{
    $set = implode(', ', array_map(static fn(string $c) => "$c = :$c", array_keys($d)));
    $stmt = db()->prepare("UPDATE property SET $set, updated_at = :updated_at WHERE id = :id");
    $stmt->execute($d + ['id' => $id, 'updated_at' => date('c')]);
}

function delete_property(string $id): void
{
    $stmt = db()->prepare('SELECT id FROM property_image WHERE property_id = ?');
    $stmt->execute([$id]);
    foreach ($stmt->fetchAll() as $row) {
        delete_property_image($row['id']);
    }
    db()->prepare('DELETE FROM property WHERE id = ?')->execute([$id]);
}

/** Список объектов для панели: со статусом, числом фото и количеством заявок. */
function admin_properties(?string $status = null, string $query = ''): array
{
    $where = [];
    $args = [];
    if ($status !== null && in_array($status, prop_statuses(), true)) {
        $where[] = 'p.status = ?';
        $args[] = $status;
    }
    if ($query !== '') {
        $where[] = '(p.title LIKE ? OR p.address LIKE ? OR p.external_id LIKE ?)';
        $like = '%' . $query . '%';
        array_push($args, $like, $like, $like);
    }
    $sql = 'SELECT p.*, (SELECT COUNT(*) FROM property_image i WHERE i.property_id = p.id) AS images_count,
            (SELECT COUNT(*) FROM lead l WHERE l.property_id = p.id) AS leads_count
            FROM property p' . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
        . ' ORDER BY p.updated_at DESC LIMIT 500';
    $stmt = db()->prepare($sql);
    $stmt->execute($args);
    return array_map(static function (array $r): array {
        $p = property_row_to_array($r);
        $p['imagesCount'] = (int) $r['images_count'];
        $p['leadsCount'] = (int) $r['leads_count'];
        return $p;
    }, $stmt->fetchAll());
}

/** Данные кейса из формы. */
function collect_case_form(?string $currentId = null): array
{
    $errors = [];
    $title = post('title');
    if (mb_strlen($title) < 3) {
        $errors['title'] = 'Укажите название кейса';
    }
    $slug = post('slug') !== '' ? slugify(post('slug')) : slugify($title);
    if ($slug === '' || !is_valid_slug($slug)) {
        $errors['slug'] = 'Адрес страницы: латиница, цифры и дефис';
    } else {
        $stmt = db()->prepare('SELECT id FROM case_item WHERE slug = ?' . ($currentId ? ' AND id <> ?' : ''));
        $stmt->execute($currentId ? [$slug, $currentId] : [$slug]);
        if ($stmt->fetchColumn()) {
            $errors['slug'] = 'Такой адрес страницы уже занят';
        }
    }
    if (!in_array(post('kind'), prop_kinds(), true)) {
        $errors['kind'] = 'Выберите тип помещения';
    }
    if (!in_array(post('dealType'), deal_types(), true)) {
        $errors['dealType'] = 'Выберите тип сделки';
    }
    if (post('task') === '' || post('solution') === '' || post('result') === '') {
        $errors['task'] = 'Заполните задачу, решение и результат';
    }
    $district = post('district');
    if ($district !== '') {
        $district = district_by_slug($district) ?? $district;
    }

    return [
        'errors' => $errors,
        'data' => [
            'slug' => $slug,
            'title' => $title,
            'kind' => post('kind'),
            'deal_type' => post('dealType'),
            'district' => $district !== '' ? $district : null,
            'area_m2' => post_num('areaM2'),
            'amount_label' => post('amountLabel') !== '' ? post('amountLabel') : null,
            'duration_label' => post('durationLabel') !== '' ? post('durationLabel') : null,
            'task' => post('task'),
            'solution' => post('solution'),
            'result' => post('result'),
            'cover_url' => post('coverUrl') !== '' ? post('coverUrl') : null,
            'is_featured' => post_bool('isFeatured') ? 1 : 0,
            'sort_order' => (int) (post_num('order') ?? 0),
        ],
    ];
}

function insert_case(array $d): string
{
    $id = new_id();
    $cols = array_keys($d);
    $stmt = db()->prepare('INSERT INTO case_item (id, ' . implode(', ', $cols) . ', created_at) VALUES (:id, :'
        . implode(', :', $cols) . ', :created_at)');
    $stmt->execute($d + ['id' => $id, 'created_at' => date('c')]);
    return $id;
}

function update_case(string $id, array $d): void
{
    $set = implode(', ', array_map(static fn(string $c) => "$c = :$c", array_keys($d)));
    db()->prepare("UPDATE case_item SET $set WHERE id = :id")->execute($d + ['id' => $id]);
}

function delete_case(string $id): void
{
    db()->prepare('DELETE FROM case_item WHERE id = ?')->execute([$id]);
}

function save_testimonial(?string $id, string $author, ?string $role, string $text, int $order, bool $isPublic): void
{
    if ($id !== null && find_testimonial($id) !== null) {
        db()->prepare('UPDATE testimonial SET author = ?, role = ?, text = ?, sort_order = ?, is_public = ? WHERE id = ?')
            ->execute([$author, $role, $text, $order, $isPublic ? 1 : 0, $id]);
        return;
    }
    db()->prepare('INSERT INTO testimonial (id, author, role, text, sort_order, is_public) VALUES (?,?,?,?,?,?)')
        ->execute([new_id(), $author, $role, $text, $order, $isPublic ? 1 : 0]);
}

function delete_testimonial(string $id): void
{
    db()->prepare('DELETE FROM testimonial WHERE id = ?')->execute([$id]);
}
