<?php
/** Кейсы в панели. */
declare(strict_types=1);

function admin_cases_list(): void
{
    $items = all_cases();
    admin_head(t('admin.cases.title'));
    admin_page_header(
        t('admin.cases.title'),
        '<a href="/admin/cases/new" class="' . e(btn('primary', 'sm')) . '">' . icon('plus') . e(t('admin.cases.new')) . '</a>'
    );

    if (!$items) {
        echo '<p class="text-ink-muted">' . e(t('admin.common.empty')) . '</p>';
        admin_foot();
        return;
    }

    echo admin_table_open([
        t('admin.cases.columns.title'),
        t('admin.cases.columns.kind'),
        t('admin.cases.columns.deal'),
        t('admin.cases.columns.featured'),
        t('admin.cases.columns.order'),
        t('admin.common.actions'),
    ]);
    foreach ($items as $c) {
        echo '<tr>';
        echo td('<a href="/admin/cases/' . e($c['id']) . '" class="font-medium hover:underline">' . e($c['title']) . '</a>'
            . '<span class="block text-xs text-ink-muted">' . e($c['slug']) . '</span>');
        echo td(e(kind_label($c['kind'])));
        echo td(e(deal_label($c['dealType'])));
        echo td($c['isFeatured'] ? e(t('admin.common.yes')) : e(t('admin.common.no')));
        echo td((string) $c['order'], 'tabular');
        echo td('<div class="flex items-center gap-1">'
            . '<a href="/cases/' . e($c['slug']) . '" target="_blank" rel="noopener" class="' . e(btn('ghost', 'sm')) . '" aria-label="' . e(t('admin.nav.site')) . '">' . icon('eye') . '</a>'
            . '<a href="/admin/cases/' . e($c['id']) . '" class="' . e(btn('ghost', 'sm')) . '" aria-label="' . e(t('admin.common.edit')) . '">' . icon('pencil') . '</a>'
            . delete_form('/admin/cases/delete', $c['id'], t('admin.common.delete'))
            . '</div>');
        echo '</tr>';
    }
    echo admin_table_close();
    admin_foot();
}

function admin_case_delete(): void
{
    csrf_check();
    $id = post('id');
    if (find_case_by_id($id)) {
        delete_case($id);
        flash_set('Кейс удалён');
    }
    redirect('/admin/cases', 303);
}

function admin_case_form(?string $id, string $method): void
{
    $item = $id === null ? null : find_case_by_id($id);
    if ($id !== null && $item === null) {
        redirect('/admin/cases');
    }
    $errors = [];

    if ($method === 'POST') {
        csrf_check();
        $cover = handle_case_cover($item);
        $form = collect_case_form($id);
        $errors = $form['errors'];
        if (isset($cover['error'])) {
            $errors['cover'] = $cover['error'];
        } elseif (array_key_exists('url', $cover)) {
            $form['data']['cover_url'] = $cover['url'];
        }
        if (!$errors) {
            if ($id === null) {
                $newId = insert_case($form['data']);
                flash_set(t('admin.common.saved'));
                redirect('/admin/cases/' . $newId, 303);
            }
            update_case($id, $form['data']);
            flash_set(t('admin.common.saved'));
            redirect('/admin/cases/' . $id, 303);
        }
        $item = array_merge($item ?? [], [
            'slug' => $form['data']['slug'],
            'title' => $form['data']['title'],
            'kind' => $form['data']['kind'],
            'dealType' => $form['data']['deal_type'],
            'district' => $form['data']['district'],
            'areaM2' => $form['data']['area_m2'],
            'amountLabel' => $form['data']['amount_label'],
            'durationLabel' => $form['data']['duration_label'],
            'task' => $form['data']['task'],
            'solution' => $form['data']['solution'],
            'result' => $form['data']['result'],
            'coverUrl' => $form['data']['cover_url'],
            'isFeatured' => (bool) $form['data']['is_featured'],
            'order' => $form['data']['sort_order'],
        ], ['id' => $id]);
    }

    $v = static function (string $key, mixed $default = '') use ($item) {
        $val = $item[$key] ?? $default;
        return $val === null ? '' : (string) $val;
    };
    $kinds = [];
    foreach (prop_kinds() as $k) {
        $kinds[$k] = kind_label($k);
    }
    $deals = [];
    foreach (deal_types() as $d) {
        $deals[$d] = deal_label($d);
    }
    $districtValue = $item && filled($item['district']) ? (district_slug((string) $item['district']) ?? '') : '';
    $err = static fn(string $field): ?string => $errors[$field] ?? null;

    admin_head($id === null ? t('admin.cases.new') : t('admin.cases.edit'));
    admin_page_header(
        $id === null ? t('admin.cases.new') : t('admin.cases.edit'),
        '<a href="/admin/cases" class="' . e(btn('ghost', 'sm')) . '">' . e(t('admin.common.cancel')) . '</a>'
    );
    if ($errors) {
        echo admin_notice(implode('; ', $errors), 'error');
    }
    ?>
<form method="post" enctype="multipart/form-data" class="space-y-6">
<?= csrf_field() ?>
<?= admin_panel_open(t('admin.objects.groups.main')) ?>
<div class="grid gap-4 sm:grid-cols-2">
  <?= field_input('c-title', 'title', t('admin.cases.fields.title'), ['value' => $v('title'), 'required' => true, 'error' => $err('title'), 'wrap' => 'sm:col-span-2']) ?>
  <?= field_input('c-slug', 'slug', t('admin.cases.fields.slug'), ['value' => $v('slug'), 'hint' => t('admin.objects.fields.slugHint'), 'error' => $err('slug')]) ?>
  <?= field_input('c-order', 'order', t('admin.cases.fields.order'), ['value' => $v('order', '0'), 'type' => 'number', 'min' => 0]) ?>
  <?= field_select('c-kind', 'kind', t('admin.cases.fields.kind'), $kinds, ['value' => $v('kind', 'RETAIL'), 'required' => true, 'error' => $err('kind')]) ?>
  <?= field_select('c-deal', 'dealType', t('admin.cases.fields.dealType'), $deals, ['value' => $v('dealType', 'RENT'), 'required' => true, 'error' => $err('dealType')]) ?>
  <?= field_select('c-district', 'district', t('admin.cases.fields.district'), districts(), ['value' => $districtValue, 'placeholder' => '—']) ?>
  <?= field_input('c-area', 'areaM2', t('admin.cases.fields.areaM2'), ['value' => $v('areaM2'), 'type' => 'number', 'step' => 'any', 'min' => 0]) ?>
  <?= field_input('c-amount', 'amountLabel', t('admin.cases.fields.amountLabel'), ['value' => $v('amountLabel')]) ?>
  <?= field_input('c-duration', 'durationLabel', t('admin.cases.fields.durationLabel'), ['value' => $v('durationLabel')]) ?>
</div>
<div class="mt-4"><?= field_checkbox('c-featured', 'isFeatured', t('admin.cases.fields.isFeatured'), ['value' => '1', 'checked' => !empty($item['isFeatured'])]) ?></div>
<?= admin_panel_close() ?>

<?= admin_panel_open(t('admin.objects.groups.texts')) ?>
<div class="space-y-4">
  <?= field_textarea('c-task', 'task', t('admin.cases.fields.task'), ['value' => $v('task'), 'rows' => 4, 'required' => true, 'error' => $err('task')]) ?>
  <?= field_textarea('c-solution', 'solution', t('admin.cases.fields.solution'), ['value' => $v('solution'), 'rows' => 5, 'required' => true]) ?>
  <?= field_textarea('c-result', 'result', t('admin.cases.fields.result'), ['value' => $v('result'), 'rows' => 4, 'required' => true]) ?>
</div>
<?= admin_panel_close() ?>

<?= admin_panel_open(t('admin.cases.fields.cover')) ?>
<?php if (filled($v('coverUrl'))): ?>
<img src="<?= e($v('coverUrl')) ?>" alt="" class="mb-3 aspect-[16/9] w-full max-w-md rounded-base object-cover"/>
<label class="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" name="removeCover" value="1" class="size-4"/><?= e(t('admin.cases.cover.remove')) ?></label>
<?php endif ?>
<div class="flex flex-col gap-1.5">
  <label for="c-cover" class="text-sm font-medium"><?= e(filled($v('coverUrl')) ? t('admin.cases.cover.replace') : t('admin.cases.cover.upload')) ?></label>
  <input id="c-cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" class="<?= e(CONTROL_CLASS . ' py-2') ?>"/>
</div>
<input type="hidden" name="coverUrl" value="<?= e($v('coverUrl')) ?>"/>
<?= admin_panel_close() ?>

<div class="flex gap-3">
  <button type="submit" class="<?= e(btn('primary', 'md')) ?>"><?= e(t('admin.common.save')) ?></button>
  <a href="/admin/cases" class="<?= e(btn('ghost', 'md')) ?>"><?= e(t('admin.common.cancel')) ?></a>
</div>
</form>
<?php
    admin_foot();
}

/**
 * Обложка кейса: новая загрузка, удаление или оставить как есть.
 * Возвращает ['url' => ...], ['error' => ...] или пустой массив, если менять нечего.
 */
function handle_case_cover(?array $item): array
{
    if (post_bool('removeCover')) {
        if ($item && filled($item['coverUrl']) && str_starts_with((string) $item['coverUrl'], '/uploads/')) {
            @unlink(ROOT_DIR . $item['coverUrl']);
        }
        return ['url' => null];
    }
    $file = $_FILES['cover'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return [];
    }
    $saved = save_uploaded_image($file);
    if (isset($saved['error'])) {
        return ['error' => $saved['error']];
    }
    return ['url' => $saved['url']];
}
