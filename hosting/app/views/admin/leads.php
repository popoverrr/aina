<?php
/** Заявки: список, смена статуса, выгрузка в CSV. */
declare(strict_types=1);

function admin_leads_page(string $method): void
{
    if ($method === 'POST') {
        csrf_check();
        $action = post('action');
        if ($action === 'status') {
            set_lead_status(post('id'), post('value'));
        } elseif ($action === 'delete') {
            delete_lead(post('id'));
            flash_set('Заявка удалена');
        }
        redirect('/admin/leads' . with_query([], array_intersect_key($_GET, array_flip(['status', 'type']))), 303);
    }

    $status = in_array(param('status', ''), lead_statuses(), true) ? (string) param('status') : null;
    $type = in_array(param('type', ''), lead_types(), true) ? (string) param('type') : null;
    $leads = list_leads($status, $type);
    $new = count_new_leads();

    admin_head(t('admin.leads.title'));
    admin_page_header(
        t('admin.leads.title'),
        '<a href="/admin/leads/export' . e(with_query([])) . '" class="' . e(btn('secondary', 'sm')) . '">' . icon('download') . e(t('admin.leads.export')) . '</a>',
        '<p class="mt-1 text-sm text-ink-muted">' . e(new_leads_label($new)) . '</p>'
    );
    ?>
<form method="get" action="/admin/leads" class="mb-5 flex flex-wrap items-end gap-3">
  <div class="flex flex-col gap-1.5">
    <label for="l-status" class="text-sm font-medium"><?= e(t('admin.leads.filter.status')) ?></label>
    <select id="l-status" name="status" class="<?= e(CONTROL_CLASS . ' h-11') ?>">
      <option value=""><?= e(t('admin.common.all')) ?></option>
      <?php foreach (lead_statuses() as $s): ?>
      <option value="<?= e($s) ?>"<?= $status === $s ? ' selected' : '' ?>><?= e(lead_status_label($s)) ?></option>
      <?php endforeach ?>
    </select>
  </div>
  <div class="flex flex-col gap-1.5">
    <label for="l-type" class="text-sm font-medium"><?= e(t('admin.leads.columns.type')) ?></label>
    <select id="l-type" name="type" class="<?= e(CONTROL_CLASS . ' h-11') ?>">
      <option value=""><?= e(t('admin.common.all')) ?></option>
      <?php foreach (lead_types() as $lt): ?>
      <option value="<?= e($lt) ?>"<?= $type === $lt ? ' selected' : '' ?>><?= e(lead_type_label($lt)) ?></option>
      <?php endforeach ?>
    </select>
  </div>
  <button type="submit" class="<?= e(btn('secondary', 'md')) ?>"><?= e(t('admin.leads.filter.apply')) ?></button>
  <a href="/admin/leads" class="<?= e(btn('ghost', 'md')) ?>"><?= e(t('admin.leads.filter.reset')) ?></a>
</form>

<?php if (!$leads): ?>
<p class="text-ink-muted"><?= e(t('admin.common.empty')) ?></p>
<?php else: ?>
<?= admin_table_open([
    t('admin.leads.columns.date'),
    t('admin.leads.columns.type'),
    t('admin.leads.columns.name'),
    t('admin.leads.columns.phone'),
    t('admin.leads.columns.object'),
    t('admin.leads.columns.comment'),
    t('admin.leads.columns.source'),
    t('admin.leads.columns.status'),
    t('admin.common.actions'),
]) ?>
<?php foreach ($leads as $l): ?>
<tr<?= $l['status'] === 'NEW' ? ' class="bg-accent/5"' : '' ?>>
  <?= td(e(fmt_date($l['createdAt'], true)), 'tabular whitespace-nowrap') ?>
  <?= td(e(lead_type_label($l['type']))) ?>
  <?= td(e($l['name'])) ?>
  <?= td('<a href="' . e(phone_href($l['phone'])) . '" class="hover:underline tabular">' . e(fmt_phone($l['phone'])) . '</a>'
      . ' <a href="' . e(whatsapp_link($l['phone'])) . '" target="_blank" rel="noopener" class="text-success hover:underline">WA</a>') ?>
  <?= td(filled($l['propertySlug'])
      ? '<a href="/objects/' . e((string) $l['propertySlug']) . '" target="_blank" rel="noopener" class="hover:underline">' . e((string) $l['propertyTitle']) . '</a>'
      : e(t('admin.leads.noObject'))) ?>
  <?= td(lead_details_cell($l), 'max-w-xs') ?>
  <?= td(lead_source_cell($l), 'text-xs text-ink-muted') ?>
  <?= td(lead_status_form($l)) ?>
  <?= td(delete_form_lead($l['id'])) ?>
</tr>
<?php endforeach ?>
<?= admin_table_close() ?>
<?php endif ?>
<?php
    admin_foot();
}

/** Комментарий и бриф в одной ячейке — всё, что клиент написал. */
function lead_details_cell(array $l): string
{
    $parts = [];
    if (filled($l['comment'])) {
        $parts[] = e((string) $l['comment']);
    }
    $brief = [];
    if (filled($l['briefKind'])) {
        $brief[] = kind_label((string) $l['briefKind']);
    }
    if ($l['briefAreaFrom'] !== null || $l['briefAreaTo'] !== null) {
        $brief[] = trim(($l['briefAreaFrom'] !== null ? fmt_area($l['briefAreaFrom']) : '') . '–' . ($l['briefAreaTo'] !== null ? fmt_area($l['briefAreaTo']) : ''), '–');
    }
    if (filled($l['briefBudget'])) {
        $brief[] = (string) $l['briefBudget'];
    }
    if ($l['briefDistricts']) {
        $brief[] = implode(', ', $l['briefDistricts']);
    }
    if (filled($l['briefBusiness'])) {
        $brief[] = (string) $l['briefBusiness'];
    }
    if ($brief) {
        $parts[] = '<span class="block text-xs text-ink-muted">' . e(t('admin.leads.brief')) . ': ' . e(implode(' · ', $brief)) . '</span>';
    }
    return $parts ? implode(' ', $parts) : '—';
}

function lead_source_cell(array $l): string
{
    if (!$l['utm'] && !filled($l['referrer'])) {
        return e(t('admin.leads.direct'));
    }
    $rows = [];
    foreach ($l['utm'] as $key => $value) {
        $rows[] = e($key . '=' . $value);
    }
    if (filled($l['pagePath'])) {
        $rows[] = e((string) $l['pagePath']);
    }
    return implode('<br/>', $rows);
}

function lead_status_form(array $l): string
{
    $html = '<form method="post" action="/admin/leads" class="inline" data-autosubmit>' . csrf_field()
        . '<input type="hidden" name="action" value="status"/><input type="hidden" name="id" value="' . e($l['id']) . '"/>'
        . '<select name="value" aria-label="' . e(t('admin.leads.columns.status')) . '" class="h-9 rounded-base border border-line bg-surface px-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none">';
    foreach (lead_statuses() as $s) {
        $html .= '<option value="' . e($s) . '"' . ($l['status'] === $s ? ' selected' : '') . '>' . e(lead_status_label($s)) . '</option>';
    }
    return $html . '</select><noscript><button type="submit" class="ml-1 text-xs underline">OK</button></noscript></form>';
}

function delete_form_lead(string $id): string
{
    return '<form method="post" action="/admin/leads" class="inline" data-confirm="' . e(t('admin.common.confirmDelete')) . '">'
        . csrf_field() . '<input type="hidden" name="action" value="delete"/><input type="hidden" name="id" value="' . e($id) . '"/>'
        . '<button type="submit" class="' . e(btn('ghost', 'sm', 'text-hot')) . '" aria-label="' . e(t('admin.common.delete')) . '">' . icon('trash') . '</button></form>';
}

function admin_leads_export(): void
{
    $status = in_array(param('status', ''), lead_statuses(), true) ? (string) param('status') : null;
    $type = in_array(param('type', ''), lead_types(), true) ? (string) param('type') : null;
    $csv = leads_csv(list_leads($status, $type, 5000));

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="leads-' . date('Y-m-d') . '.csv"');
    header('Content-Length: ' . strlen($csv));
    echo $csv;
    exit;
}
