<?php
/** Объекты в панели: список, карточка, фотографии. */
declare(strict_types=1);

function admin_objects_list(): void
{
    $status = in_array(param('status', ''), prop_statuses(), true) ? (string) param('status') : null;
    $query = trim((string) param('q', ''));
    $items = admin_properties($status, $query);

    admin_head(t('admin.objects.title'));
    admin_page_header(
        t('admin.objects.title'),
        '<a href="/admin/objects/new" class="' . e(btn('primary', 'sm')) . '">' . icon('plus') . e(t('admin.objects.new')) . '</a>'
    );
    ?>
<form method="get" action="/admin/objects" class="mb-5 flex flex-wrap items-end gap-3">
  <div class="flex flex-col gap-1.5">
    <label for="q" class="text-sm font-medium"><?= e(t('admin.common.search')) ?></label>
    <input id="q" name="q" value="<?= e($query) ?>" placeholder="<?= e(t('admin.objects.filter.searchPlaceholder')) ?>" class="<?= e(CONTROL_CLASS . ' h-11 w-64') ?>"/>
  </div>
  <div class="flex flex-col gap-1.5">
    <label for="status" class="text-sm font-medium"><?= e(t('admin.objects.filter.status')) ?></label>
    <select id="status" name="status" class="<?= e(CONTROL_CLASS . ' h-11') ?>">
      <option value=""><?= e(t('admin.common.all')) ?></option>
      <?php foreach (prop_statuses() as $s): ?>
      <option value="<?= e($s) ?>"<?= $status === $s ? ' selected' : '' ?>><?= e(status_label($s)) ?></option>
      <?php endforeach ?>
    </select>
  </div>
  <button type="submit" class="<?= e(btn('secondary', 'md')) ?>"><?= e(t('admin.leads.filter.apply')) ?></button>
  <a href="/admin/objects" class="<?= e(btn('ghost', 'md')) ?>"><?= e(t('admin.leads.filter.reset')) ?></a>
</form>

<?php if (!$items): ?>
<p class="text-ink-muted"><?= e(t('admin.common.empty')) ?></p>
<?php else: ?>
<?= admin_table_open([
    t('admin.objects.columns.title'),
    t('admin.objects.columns.kind'),
    t('admin.objects.columns.district'),
    t('admin.objects.columns.area'),
    t('admin.objects.columns.price'),
    t('admin.objects.columns.status'),
    t('admin.objects.columns.flags'),
    t('admin.objects.columns.date'),
    t('admin.common.actions'),
]) ?>
<?php foreach ($items as $p): ?>
<tr>
  <?= td('<a href="/admin/objects/' . e($p['id']) . '" class="font-medium hover:underline">' . e($p['title']) . '</a>'
      . '<span class="block text-xs text-ink-muted">' . e($p['slug']) . ' · ' . $p['imagesCount'] . ' фото · заявок: ' . $p['leadsCount'] . '</span>') ?>
  <?= td(e(kind_label($p['kind']))) ?>
  <?= td(e($p['district'])) ?>
  <?= td(e(fmt_area($p['areaM2'])), 'tabular') ?>
  <?= td(e($p['priceRentTotal'] !== null ? fmt_price($p['priceRentTotal']) : ($p['priceSale'] !== null ? fmt_price($p['priceSale']) : '—')), 'tabular') ?>
  <?= td(admin_status_form($p)) ?>
  <?= td(admin_flag_buttons($p)) ?>
  <?= td(e(fmt_date($p['updatedAt'])), 'tabular whitespace-nowrap') ?>
  <?= td('<div class="flex items-center gap-1">'
      . '<a href="/objects/' . e($p['slug']) . '" target="_blank" rel="noopener" class="' . e(btn('ghost', 'sm')) . '" aria-label="' . e(t('admin.nav.site')) . '">' . icon('eye') . '</a>'
      . '<a href="/admin/objects/' . e($p['id']) . '" class="' . e(btn('ghost', 'sm')) . '" aria-label="' . e(t('admin.common.edit')) . '">' . icon('pencil') . '</a>'
      . delete_form('/admin/objects/delete', $p['id'], t('admin.common.delete'))
      . '</div>') ?>
</tr>
<?php endforeach ?>
<?= admin_table_close() ?>
<?php endif ?>
<?php
    admin_foot();
}

/** Смена статуса прямо из таблицы. */
function admin_status_form(array $p): string
{
    $html = '<form method="post" action="/admin/objects/flag" class="inline" data-autosubmit>' . csrf_field()
        . '<input type="hidden" name="id" value="' . e($p['id']) . '"/><input type="hidden" name="field" value="status"/>'
        . '<select name="value" aria-label="' . e(t('admin.objects.fields.status')) . '" class="h-9 rounded-base border border-line bg-surface px-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none">';
    foreach (prop_statuses() as $s) {
        $html .= '<option value="' . e($s) . '"' . ($p['status'] === $s ? ' selected' : '') . '>' . e(status_label($s)) . '</option>';
    }
    return $html . '</select><noscript><button type="submit" class="ml-1 text-xs underline">OK</button></noscript></form>';
}

/** Переключатели «горящий» и «на главной». */
function admin_flag_buttons(array $p): string
{
    $button = static function (array $p, string $field, bool $active, string $ico, string $label): string {
        $cls = 'flex size-8 items-center justify-center rounded-base border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent '
            . ($active ? 'border-accent bg-accent text-white' : 'border-line text-ink-muted hover:border-ink-muted');
        return '<form method="post" action="/admin/objects/flag" class="inline">' . csrf_field()
            . '<input type="hidden" name="id" value="' . e($p['id']) . '"/>'
            . '<input type="hidden" name="field" value="' . e($field) . '"/>'
            . '<input type="hidden" name="value" value="' . ($active ? '0' : '1') . '"/>'
            . '<button type="submit" class="' . $cls . '" aria-pressed="' . ($active ? 'true' : 'false') . '" aria-label="' . e($label) . '" title="' . e($label) . '">' . icon($ico) . '</button></form>';
    };
    return '<div class="flex gap-1.5">'
        . $button($p, 'is_hot', $p['isHot'], 'flame', t('admin.objects.flags.hot'))
        . $button($p, 'is_featured', $p['isFeatured'], 'star', t('admin.objects.flags.featured'))
        . '</div>';
}

function admin_object_flag(): void
{
    csrf_check();
    $id = post('id');
    $field = post('field');
    $value = post('value');
    $property = find_property_by_id($id);
    if ($property) {
        if ($field === 'status' && in_array($value, prop_statuses(), true)) {
            update_property($id, ['status' => $value]);
        } elseif (in_array($field, ['is_hot', 'is_featured', 'is_exclusive'], true)) {
            update_property($id, [$field => $value === '1' ? 1 : 0]);
        }
        flash_set(t('admin.common.saved'));
    }
    redirect($_SERVER['HTTP_REFERER'] ?? '/admin/objects', 303);
}

function admin_object_delete(): void
{
    csrf_check();
    $id = post('id');
    if (find_property_by_id($id)) {
        delete_property($id);
        flash_set('Объект удалён');
    }
    redirect('/admin/objects', 303);
}

/** Карточка объекта: создание и правка. */
function admin_object_form(?string $id, string $method): void
{
    $property = $id === null ? null : find_property_by_id($id);
    if ($id !== null && $property === null) {
        redirect('/admin/objects');
    }
    $errors = [];

    if ($method === 'POST') {
        csrf_check();
        $form = collect_property_form($id);
        $errors = $form['errors'];
        if (!$errors) {
            if ($id === null) {
                $newId = insert_property($form['data']);
                flash_set(t('admin.common.saved'));
                redirect('/admin/objects/' . $newId, 303);
            }
            update_property($id, $form['data']);
            flash_set(t('admin.common.saved'));
            redirect('/admin/objects/' . $id, 303);
        }
        // При ошибке показываем то, что ввели, а не то, что в базе.
        $property = array_merge($property ?? [], camel_property($form['data']), ['id' => $id]);
    }

    $v = static function (string $key, mixed $default = '') use ($property) {
        $val = $property[$key] ?? $default;
        return $val === null ? '' : (string) $val;
    };
    $b = static fn(string $key): bool => !empty($property[$key]);
    $kinds = [];
    foreach (prop_kinds() as $k) {
        $kinds[$k] = kind_label($k);
    }
    $statuses = [];
    foreach (prop_statuses() as $s) {
        $statuses[$s] = status_label($s);
    }
    $deals = [];
    foreach (deal_types() as $d) {
        $deals[$d] = deal_label($d);
    }
    $districtValue = $property ? (district_slug((string) $property['district']) ?? '') : '';
    $images = $property && $id !== null ? property_images($id) : [];

    admin_head($id === null ? t('admin.objects.new') : t('admin.objects.edit'));
    admin_page_header(
        $id === null ? t('admin.objects.new') : t('admin.objects.edit'),
        '<a href="/admin/objects" class="' . e(btn('ghost', 'sm')) . '">' . e(t('admin.common.cancel')) . '</a>'
    );
    if ($errors) {
        echo admin_notice(t('admin.objects.errors.unknown'), 'error');
    }
    $err = static fn(string $field): ?string => $errors[$field] ?? null;
    ?>
<form method="post" class="space-y-6" data-draft="object-<?= e((string) $id) ?>">
<?= csrf_field() ?>

<?= admin_panel_open(t('admin.objects.groups.main')) ?>
<div class="grid gap-4 sm:grid-cols-2">
  <?= field_input('o-title', 'title', t('admin.objects.fields.title'), ['value' => $v('title'), 'required' => true, 'error' => $err('title'), 'wrap' => 'sm:col-span-2']) ?>
  <?= field_input('o-slug', 'slug', t('admin.objects.fields.slug'), ['value' => $v('slug'), 'hint' => t('admin.objects.fields.slugHint'), 'error' => $err('slug')]) ?>
  <?= field_input('o-external', 'externalId', t('admin.objects.fields.externalId'), ['value' => $v('externalId')]) ?>
  <?= field_select('o-kind', 'kind', t('admin.objects.fields.kind'), $kinds, ['value' => $v('kind', 'RETAIL'), 'required' => true, 'error' => $err('kind')]) ?>
  <?= field_select('o-deal', 'dealType', t('admin.objects.fields.dealType'), $deals, ['value' => $v('dealType', 'RENT'), 'required' => true, 'error' => $err('dealType')]) ?>
  <?= field_select('o-status', 'status', t('admin.objects.fields.status'), $statuses, ['value' => $v('status', 'ACTIVE')]) ?>
</div>
<?= admin_panel_close() ?>

<?= admin_panel_open(t('admin.objects.groups.location')) ?>
<div class="grid gap-4 sm:grid-cols-2">
  <?= field_select('o-district', 'district', t('admin.objects.fields.district'), districts(), ['value' => $districtValue, 'placeholder' => '—', 'required' => true, 'error' => $err('district')]) ?>
  <?= field_input('o-landmark', 'landmark', t('admin.objects.fields.landmark'), ['value' => $v('landmark')]) ?>
  <?= field_input('o-address', 'address', t('admin.objects.fields.address'), ['value' => $v('address'), 'wrap' => 'sm:col-span-2']) ?>
  <?= field_input('o-lat', 'lat', t('admin.objects.fields.lat'), ['value' => $v('lat'), 'type' => 'number', 'step' => 'any']) ?>
  <?= field_input('o-lng', 'lng', t('admin.objects.fields.lng'), ['value' => $v('lng'), 'type' => 'number', 'step' => 'any']) ?>
</div>
<?= admin_panel_close() ?>

<?= admin_panel_open(t('admin.objects.groups.params')) ?>
<div class="grid gap-4 sm:grid-cols-3">
  <?= field_input('o-area', 'areaM2', t('admin.objects.fields.areaM2'), ['value' => $v('areaM2'), 'type' => 'number', 'step' => 'any', 'min' => 0, 'required' => true, 'error' => $err('areaM2')]) ?>
  <?= field_input('o-ceiling', 'ceilingM', t('admin.objects.fields.ceilingM'), ['value' => $v('ceilingM'), 'type' => 'number', 'step' => 'any', 'min' => 0]) ?>
  <?= field_input('o-power', 'powerKw', t('admin.objects.fields.powerKw'), ['value' => $v('powerKw'), 'type' => 'number', 'step' => 'any', 'min' => 0]) ?>
  <?= field_input('o-floor', 'floor', t('admin.objects.fields.floor'), ['value' => $v('floor')]) ?>
  <?= field_input('o-entrance', 'entrance', t('admin.objects.fields.entrance'), ['value' => $v('entrance')]) ?>
</div>
<div class="mt-4"><?= field_checkbox('o-wet', 'hasWetPoint', t('admin.objects.fields.hasWetPoint'), ['value' => '1', 'checked' => $b('hasWetPoint')]) ?></div>
<?= admin_panel_close() ?>

<?= admin_panel_open(t('admin.objects.groups.price')) ?>
<div class="grid gap-4 sm:grid-cols-3">
  <?= field_input('o-price-sale', 'priceSale', t('admin.objects.fields.priceSale'), ['value' => $v('priceSale'), 'type' => 'number', 'step' => 'any', 'min' => 0, 'error' => $err('priceSale')]) ?>
  <?= field_input('o-price-m2', 'priceRentM2', t('admin.objects.fields.priceRentM2'), ['value' => $v('priceRentM2'), 'type' => 'number', 'step' => 'any', 'min' => 0]) ?>
  <?= field_input('o-price-total', 'priceRentTotal', t('admin.objects.fields.priceRentTotal'), ['value' => $v('priceRentTotal'), 'type' => 'number', 'step' => 'any', 'min' => 0, 'error' => $err('priceRentTotal')]) ?>
</div>
<div class="mt-4"><?= field_checkbox('o-utils', 'utilitiesIncluded', t('admin.objects.fields.utilitiesIncluded'), ['value' => '1', 'checked' => $b('utilitiesIncluded')]) ?></div>
<?= admin_panel_close() ?>

<?= admin_panel_open(t('admin.objects.groups.texts')) ?>
<div class="space-y-4">
  <?= field_textarea('o-desc', 'descriptionMd', t('admin.objects.fields.descriptionMd'), ['value' => $v('descriptionMd'), 'rows' => 8]) ?>
  <?= field_textarea('o-adv', 'advantages', t('admin.objects.fields.advantages'), ['value' => implode("\n", (array) ($property['advantages'] ?? [])), 'rows' => 5]) ?>
  <?= field_input('o-presentation', 'presentationUrl', t('admin.objects.fields.presentationUrl'), ['value' => $v('presentationUrl'), 'error' => $err('presentationUrl')]) ?>
</div>
<?= admin_panel_close() ?>

<?= admin_panel_open(t('admin.objects.groups.flags')) ?>
<div class="space-y-3">
  <?= field_checkbox('o-exclusive', 'isExclusive', t('admin.objects.fields.isExclusive'), ['value' => '1', 'checked' => $b('isExclusive')]) ?>
  <?= field_checkbox('o-hot', 'isHot', t('admin.objects.fields.isHot'), ['value' => '1', 'checked' => $b('isHot')]) ?>
  <?= field_checkbox('o-featured', 'isFeatured', t('admin.objects.fields.isFeatured'), ['value' => '1', 'checked' => $b('isFeatured')]) ?>
</div>
<?= admin_panel_close() ?>

<div class="flex gap-3">
  <button type="submit" class="<?= e(btn('primary', 'md')) ?>"><?= e(t('admin.common.save')) ?></button>
  <a href="/admin/objects" class="<?= e(btn('ghost', 'md')) ?>"><?= e(t('admin.common.cancel')) ?></a>
</div>
</form>

<?= admin_panel_open(t('admin.objects.groups.photos'), 'mt-6') ?>
<?php if ($id === null): ?>
<p class="text-sm text-ink-muted"><?= e(t('admin.objects.photos.saveFirst')) ?></p>
<?php else: ?>
<form method="post" action="/admin/photos" enctype="multipart/form-data" class="flex flex-wrap items-end gap-3">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="upload"/>
  <input type="hidden" name="propertyId" value="<?= e($id) ?>"/>
  <div class="flex flex-col gap-1.5">
    <label for="photos" class="text-sm font-medium"><?= e(t('admin.objects.photos.choose')) ?></label>
    <input id="photos" name="photos[]" type="file" accept="image/jpeg,image/png,image/webp" multiple required class="<?= e(CONTROL_CLASS . ' py-2') ?>"/>
  </div>
  <button type="submit" class="<?= e(btn('secondary', 'md')) ?>"><?= e(t('admin.objects.photos.choose')) ?></button>
</form>
<p class="mt-2 text-xs text-ink-muted">JPG, PNG или WebP. Фото уменьшается до 1600 px по ширине. Первое в списке — обложка.</p>

<?php if ($images): ?>
<ul class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <?php foreach ($images as $i => $img): ?>
  <li class="rounded-base border border-line p-2">
    <img src="<?= e($img['url']) ?>" alt="" class="aspect-[4/3] w-full rounded-base object-cover"/>
    <div class="mt-2 flex items-center justify-between gap-2">
      <span class="text-xs text-ink-muted"><?= $i === 0 ? 'обложка' : '№ ' . ($i + 1) ?></span>
      <div class="flex gap-1">
        <?= photo_action_form($id, (string) $img['id'], 'up', t('admin.objects.photos.moveUp'), 'chevron-left') ?>
        <?= photo_action_form($id, (string) $img['id'], 'down', t('admin.objects.photos.moveDown'), 'chevron-right') ?>
        <?= photo_action_form($id, (string) $img['id'], 'delete', t('admin.objects.photos.delete'), 'trash') ?>
      </div>
    </div>
  </li>
  <?php endforeach ?>
</ul>
<?php endif ?>
<?php endif ?>
<?= admin_panel_close() ?>
<?php
    admin_foot();
}

function photo_action_form(string $propertyId, string $imageId, string $action, string $label, string $ico): string
{
    return '<form method="post" action="/admin/photos" class="inline"' . ($action === 'delete' ? ' data-confirm="' . e(t('admin.common.confirmDelete')) . '"' : '') . '>'
        . csrf_field()
        . '<input type="hidden" name="action" value="' . e($action) . '"/>'
        . '<input type="hidden" name="propertyId" value="' . e($propertyId) . '"/>'
        . '<input type="hidden" name="imageId" value="' . e($imageId) . '"/>'
        . '<button type="submit" class="' . e(btn('ghost', 'sm', $action === 'delete' ? 'text-hot' : '')) . '" aria-label="' . e($label) . '" title="' . e($label) . '">' . icon($ico) . '</button></form>';
}

function admin_photos_action(): void
{
    csrf_check();
    $propertyId = post('propertyId');
    $property = find_property_by_id($propertyId);
    if (!$property) {
        redirect('/admin/objects');
    }
    $action = post('action');

    if ($action === 'upload') {
        $files = $_FILES['photos'] ?? null;
        $errors = [];
        $count = 0;
        if (is_array($files) && isset($files['name']) && is_array($files['name'])) {
            foreach (array_keys($files['name']) as $i) {
                $one = [
                    'name' => $files['name'][$i],
                    'type' => $files['type'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'error' => $files['error'][$i],
                    'size' => $files['size'][$i],
                ];
                $saved = save_uploaded_image($one);
                if (isset($saved['error'])) {
                    $errors[] = $files['name'][$i] . ': ' . $saved['error'];
                    continue;
                }
                attach_property_image($propertyId, $saved, $property['title']);
                $count++;
            }
        }
        flash_set($errors ? implode('; ', $errors) : 'Загружено фото: ' . $count, $errors ? 'error' : 'ok');
    } elseif ($action === 'delete') {
        delete_property_image(post('imageId'));
        flash_set('Фото удалено');
    } elseif ($action === 'up' || $action === 'down') {
        move_property_image($propertyId, post('imageId'), $action === 'up' ? -1 : 1);
    }

    redirect('/admin/objects/' . $propertyId, 303);
}

/** Данные из формы — в вид, который понимают шаблоны (camelCase, как в выборках). */
function camel_property(array $d): array
{
    return [
        'slug' => $d['slug'],
        'externalId' => $d['external_id'],
        'title' => $d['title'],
        'kind' => $d['kind'],
        'dealType' => $d['deal_type'],
        'status' => $d['status'],
        'district' => $d['district'],
        'address' => $d['address'],
        'landmark' => $d['landmark'],
        'lat' => $d['lat'],
        'lng' => $d['lng'],
        'areaM2' => $d['area_m2'],
        'ceilingM' => $d['ceiling_m'],
        'floor' => $d['floor'],
        'entrance' => $d['entrance'],
        'powerKw' => $d['power_kw'],
        'hasWetPoint' => (bool) $d['has_wet_point'],
        'priceSale' => $d['price_sale'],
        'priceRentM2' => $d['price_rent_m2'],
        'priceRentTotal' => $d['price_rent_total'],
        'utilitiesIncluded' => (bool) $d['utilities_included'],
        'isExclusive' => (bool) $d['is_exclusive'],
        'isHot' => (bool) $d['is_hot'],
        'isFeatured' => (bool) $d['is_featured'],
        'descriptionMd' => $d['description_md'],
        'advantages' => json_decode((string) $d['advantages'], true) ?: [],
        'presentationUrl' => $d['presentation_url'],
    ];
}
