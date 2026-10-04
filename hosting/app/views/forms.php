<?php
/**
 * Формы заявок. Работают обычным POST на /lead — без JavaScript тоже отправляются,
 * скрипт лишь добавляет маску телефона, прогресс брифа и отправку без перезагрузки.
 * При ошибке сервер возвращает на ту же страницу: введённое и ошибки лежат в сессии.
 */
declare(strict_types=1);

const CONTROL_CLASS = 'w-full rounded-base border bg-surface px-3.5 text-ink placeholder:text-ink-muted/70 '
    . 'transition-[border-color,box-shadow] duration-150 '
    . 'hover:border-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none '
    . 'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70 '
    . 'aria-invalid:border-hot aria-invalid:focus:ring-hot/25';

/** Введённые ранее значения и ошибки формы, сохранённые перед возвратом на страницу. */
function form_state(): array
{
    static $state = null;
    if ($state === null) {
        session_boot();
        $state = is_array($_SESSION['form_state'] ?? null) ? $_SESSION['form_state'] : [];
        unset($_SESSION['form_state']);
    }
    return $state;
}

function form_old(string $field, string $default = ''): string
{
    $old = form_state()['old'] ?? [];
    $v = $old[$field] ?? null;
    return is_string($v) ? $v : $default;
}

function form_old_list(string $field): array
{
    $v = form_state()['old'][$field] ?? null;
    return is_array($v) ? array_map('strval', $v) : [];
}

/** Текст ошибки поля или null. Коды переводятся через словарь forms.errors.*. */
function form_error(string $field): ?string
{
    $code = form_state()['errors'][$field] ?? null;
    if (!is_string($code)) {
        return null;
    }
    $map = [
        'nameShort' => 'nameTooShort',
        'nameLong' => 'nameTooLong',
        'commentLong' => 'commentTooLong',
        'phoneInvalid' => 'phoneInvalid',
    ];
    if ($code === 'consentRequired') {
        return t('forms.consent');
    }
    if ($code === 'areaRange') {
        return 'Площадь «до» меньше площади «от»';
    }
    return t('forms.errors.' . ($map[$code] ?? $code));
}

function form_has_errors(): bool
{
    return !empty(form_state()['errors']);
}

/** Общая ошибка отправки, если заявку не удалось сохранить. */
function form_general_error(): ?string
{
    $code = form_state()['general'] ?? null;
    return is_string($code) ? t('forms.errors.' . $code) : null;
}

/** Оболочка поля: подпись, ошибка, подсказка — всё связано атрибутами доступности. */
function field_shell(string $id, string $label, string $control, ?string $error = null, ?string $hint = null, bool $required = false, string $wrap = ''): string
{
    $html = '<div class="flex flex-col gap-1.5' . ($wrap !== '' ? ' ' . $wrap : '') . '">';
    $html .= '<label for="' . e($id) . '" class="text-sm font-medium text-ink">' . e($label);
    if ($required) {
        $html .= '<span class="text-hot" aria-label="' . e(t('forms.requiredMark')) . '" title="' . e(t('forms.requiredMark')) . '"> *</span>';
    }
    $html .= '</label>' . $control;
    if (filled($hint) && !filled($error)) {
        $html .= '<p id="' . e($id) . '-hint" class="text-xs text-ink-muted">' . e((string) $hint) . '</p>';
    }
    if (filled($error)) {
        $html .= '<p id="' . e($id) . '-error" role="alert" class="text-sm text-hot">' . e((string) $error) . '</p>';
    }
    return $html . '</div>';
}

function described_by(string $id, ?string $error, ?string $hint): string
{
    if (filled($error)) {
        return ' aria-describedby="' . e($id) . '-error"';
    }
    if (filled($hint)) {
        return ' aria-describedby="' . e($id) . '-hint"';
    }
    return '';
}

function attrs_str(array $attrs): string
{
    $out = '';
    foreach ($attrs as $k => $v) {
        if ($v === true) {
            $out .= ' ' . $k;
        } elseif ($v !== null && $v !== false) {
            $out .= ' ' . $k . '="' . e((string) $v) . '"';
        }
    }
    return $out;
}

function field_input(string $id, string $name, string $label, array $o = []): string
{
    $error = $o['error'] ?? form_error($name);
    $hint = $o['hint'] ?? null;
    $required = !empty($o['required']);
    $control = '<input id="' . e($id) . '" name="' . e($name) . '" type="' . e((string) ($o['type'] ?? 'text')) . '"'
        . ' value="' . e((string) ($o['value'] ?? form_old($name))) . '"'
        . ' class="' . e(CONTROL_CLASS . ' h-11') . '"'
        . attrs_str(array_intersect_key($o, array_flip(['placeholder', 'autocomplete', 'inputmode', 'min', 'max', 'step', 'maxlength', 'pattern'])))
        . ($required ? ' required aria-required="true"' : '')
        . (filled($error) ? ' aria-invalid="true"' : '')
        . described_by($id, $error, $hint) . '/>';
    return field_shell($id, $label, $control, $error, $hint, $required, (string) ($o['wrap'] ?? ''));
}

function field_phone(string $id, string $label, array $o = []): string
{
    return field_input($id, 'phone', $label, $o + [
        'type' => 'tel',
        'inputmode' => 'tel',
        'autocomplete' => 'tel',
        'placeholder' => t('forms.labels.phonePlaceholder'),
        'required' => true,
    ]);
}

function field_textarea(string $id, string $name, string $label, array $o = []): string
{
    $error = $o['error'] ?? form_error($name);
    $rows = (int) ($o['rows'] ?? 4);
    $control = '<textarea id="' . e($id) . '" name="' . e($name) . '" rows="' . $rows . '"'
        . ' class="' . e(CONTROL_CLASS . ' py-2.5 resize-y min-h-24') . '"'
        . attrs_str(array_intersect_key($o, array_flip(['placeholder', 'maxlength'])))
        . (filled($error) ? ' aria-invalid="true"' : '')
        . described_by($id, $error, null) . '>' . e((string) ($o['value'] ?? form_old($name))) . '</textarea>';
    return field_shell($id, $label, $control, $error, null, !empty($o['required']), (string) ($o['wrap'] ?? ''));
}

/** $options: [значение => подпись]. */
function field_select(string $id, string $name, string $label, array $options, array $o = []): string
{
    $error = $o['error'] ?? form_error($name);
    $value = (string) ($o['value'] ?? form_old($name));
    $arrow = "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235A6674%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat pr-10";
    $control = '<select id="' . e($id) . '" name="' . e($name) . '" class="' . e(CONTROL_CLASS . ' h-11 appearance-none ' . $arrow) . '"'
        . (!empty($o['required']) ? ' required aria-required="true"' : '')
        . (filled($error) ? ' aria-invalid="true"' : '')
        . described_by($id, $error, null) . '>';
    if (isset($o['placeholder'])) {
        $control .= '<option value="">' . e((string) $o['placeholder']) . '</option>';
    }
    foreach ($options as $val => $text) {
        $control .= '<option value="' . e((string) $val) . '"' . ((string) $val === $value ? ' selected' : '') . '>' . e((string) $text) . '</option>';
    }
    $control .= '</select>';
    return field_shell($id, $label, $control, $error, null, !empty($o['required']), (string) ($o['wrap'] ?? ''));
}

function field_checkbox(string $id, string $name, string $label, array $o = []): string
{
    $box = 'mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-base border border-line bg-surface transition-colors '
        . "checked:border-accent checked:bg-accent checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M20 6 9 17l-5-5%22/></svg>')] bg-[length:14px_14px] bg-center bg-no-repeat "
        . 'hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed';
    $html = '<label for="' . e($id) . '" class="flex cursor-pointer items-start gap-3 text-sm">';
    $html .= '<input id="' . e($id) . '" name="' . e($name) . '" type="checkbox" class="' . e($box) . '"'
        . (isset($o['value']) ? ' value="' . e((string) $o['value']) . '"' : '')
        . (!empty($o['checked']) ? ' checked' : '') . '/>';
    $html .= '<span><span class="font-medium text-ink">' . e($label) . '</span>';
    if (filled($o['description'] ?? null)) {
        $html .= '<span class="block text-ink-muted">' . e((string) $o['description']) . '</span>';
    }
    return $html . '</span></label>';
}

/** Скрытое поле-ловушка и метка времени: отсекают ботов без капчи. */
function form_antispam(): string
{
    return '<div class="absolute -left-[9999px] top-0 h-px w-px overflow-hidden" aria-hidden="true">'
        . '<label for="website-hp">Website</label>'
        . '<input id="website-hp" type="text" name="website" tabindex="-1" autocomplete="off"/>'
        . '</div><input type="hidden" name="startedAt" value="" data-started-at/>';
}

/** Строка согласия под кнопкой и необязательная приписка. */
function form_consent(?string $note = null): string
{
    $parts = explode('<link>', t('forms.consent'));
    [$before, $rest] = [$parts[0] ?? '', $parts[1] ?? ''];
    [$linkText, $after] = array_pad(explode('</link>', $rest), 2, '');
    $html = '<div class="space-y-1 text-xs text-ink-muted">';
    if (filled($note)) {
        $html .= '<p>' . e((string) $note) . '</p>';
    }
    $html .= '<p>' . e($before) . '<a href="/privacy" class="underline underline-offset-2 hover:text-ink">' . e($linkText) . '</a>' . e($after) . '</p>';
    return $html . '</div>';
}

/** Общие скрытые поля: источник перехода и страница, с которой пришла заявка. */
function form_tracking(string $type, string $backPath, ?string $propertyId = null, string $anchor = ''): string
{
    $html = '<input type="hidden" name="type" value="' . e($type) . '"/>'
        . '<input type="hidden" name="back" value="' . e($backPath) . '"/>'
        . ($anchor !== '' ? '<input type="hidden" name="anchor" value="' . e($anchor) . '"/>' : '')
        . '<input type="hidden" name="pagePath" value="' . e($backPath) . '"/>';
    if (filled($propertyId)) {
        $html .= '<input type="hidden" name="propertyId" value="' . e($propertyId) . '"/>';
    }
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as $key) {
        if (filled($_GET[$key] ?? null)) {
            $html .= '<input type="hidden" name="' . $key . '" value="' . e((string) $_GET[$key]) . '"/>';
        }
    }
    return $html;
}

function form_general_error_block(): string
{
    $text = form_general_error();
    if ($text === null) {
        return '';
    }
    return '<p role="alert" class="rounded-base border border-hot/40 bg-hot/5 px-3 py-2 text-sm text-hot">' . e($text) . '</p>';
}

function submit_button(string $label, string $extra = 'w-full sm:w-auto'): string
{
    return '<button type="submit" class="' . e(btn('primary', 'lg', $extra)) . '" data-submit data-loading-text="' . e(t('common.actions.sending')) . '">' . e($label) . '</button>';
}

/**
 * Короткая форма: имя, телефон, комментарий.
 * $type — CONTACT | OBJECT | PRESENTATION.
 */
function lead_form(array $o = []): void
{
    $type = (string) ($o['type'] ?? 'CONTACT');
    $prefix = (string) ($o['idPrefix'] ?? 'lead');
    $compact = !empty($o['compact']);
    $anchor = $prefix . '-form';
    ?>
<form method="post" action="/lead#<?= e($anchor) ?>" id="<?= e($anchor) ?>" class="relative space-y-4" data-lead-form>
<?= form_tracking($type, (string) ($o['back'] ?? current_path()), $o['propertyId'] ?? null, $anchor) ?>
<?= form_antispam() ?>
<div class="<?= $compact ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4' ?>">
<?= field_input($prefix . '-name', 'name', t('forms.labels.name'), ['placeholder' => t('forms.labels.namePlaceholder'), 'autocomplete' => 'name', 'required' => true, 'maxlength' => 80]) ?>
<?= field_phone($prefix . '-phone', t('forms.labels.phone')) ?>
</div>
<?= field_textarea($prefix . '-comment', 'comment', t('forms.labels.commentOptional'), ['rows' => $compact ? 3 : 4, 'maxlength' => 1000]) ?>
<?= form_general_error_block() ?>
<div class="space-y-3">
<?= submit_button((string) ($o['submitLabel'] ?? t('forms.labels.submit'))) ?>
<?= form_consent($o['note'] ?? null) ?>
</div>
</form>
<?php
}

/** Форма собственника: тип объекта, район, площадь. */
function owner_form(string $submitLabel, ?string $note = null): void
{
    $kinds = [];
    foreach (prop_kinds() as $k) {
        $kinds[$k] = kind_label($k);
    }
    ?>
<form method="post" action="/lead#owner-form" id="owner-form" class="relative space-y-4" data-lead-form>
<?= form_tracking('OWNER', current_path(), null, 'owner-form') ?>
<?= form_antispam() ?>
<div class="grid gap-4 sm:grid-cols-2">
<?= field_input('owner-name', 'name', t('forms.labels.name'), ['placeholder' => t('forms.labels.namePlaceholder'), 'autocomplete' => 'name', 'required' => true, 'maxlength' => 80]) ?>
<?= field_phone('owner-phone', t('forms.labels.phone')) ?>
<?= field_select('owner-kind', 'briefKind', t('forms.labels.kind'), $kinds, ['placeholder' => t('forms.labels.kindAny')]) ?>
<?= field_select('owner-district', 'districts[]', t('forms.labels.district'), districts(), ['placeholder' => t('forms.labels.districtAny'), 'value' => form_old_list('districts')[0] ?? '']) ?>
<?= field_input('owner-area', 'areaFrom', t('forms.labels.area'), ['type' => 'number', 'inputmode' => 'decimal', 'min' => 0]) ?>
</div>
<?= field_textarea('owner-comment', 'comment', t('forms.labels.commentOptional'), ['rows' => 3, 'maxlength' => 1000]) ?>
<?= form_general_error_block() ?>
<div class="space-y-3">
<?= submit_button($submitLabel) ?>
<?= form_consent($note) ?>
</div>
</form>
<?php
}

/** Бриф в четыре шага на одном экране. */
function search_brief_form(): void
{
    $kinds = [];
    foreach (prop_kinds() as $k) {
        $kinds[$k] = kind_label($k);
    }
    $chosen = form_old_list('districts');
    ?>
<form method="post" action="/lead#brief" id="brief" class="relative space-y-10" data-lead-form data-brief>
<?= form_tracking('SEARCH', current_path(), null, 'brief') ?>
<?= form_antispam() ?>
<div aria-live="polite">
  <p class="mb-2 text-sm text-ink-muted" data-brief-progress><?= e(t('search.progress', ['done' => 0, 'total' => 4])) ?></p>
  <ol class="grid grid-cols-4 gap-2" aria-hidden="true">
    <?php for ($i = 1; $i <= 4; $i++): ?><li class="h-1.5 rounded-base bg-line transition-colors" data-brief-bar="<?= $i ?>"></li><?php endfor ?>
  </ol>
</div>

<?php brief_step(1, t('search.steps.1.title'), t('search.steps.1.text')) ?>
  <div class="grid gap-4 sm:grid-cols-2">
    <?= field_select('brief-kind', 'briefKind', t('forms.labels.kind'), $kinds, ['placeholder' => t('forms.labels.kindAny')]) ?>
    <?= field_select('brief-deal', 'dealType', t('forms.labels.deal'), ['RENT' => t('forms.labels.rent'), 'SALE' => t('forms.labels.sale')], ['placeholder' => t('forms.labels.kindAny')]) ?>
  </div>
<?php brief_step_end() ?>

<?php brief_step(2, t('search.steps.2.title'), t('search.steps.2.text')) ?>
  <div class="grid gap-4 sm:grid-cols-3">
    <?= field_input('brief-area-from', 'areaFrom', t('forms.labels.areaFrom'), ['type' => 'number', 'inputmode' => 'decimal', 'min' => 0]) ?>
    <?= field_input('brief-area-to', 'areaTo', t('forms.labels.areaTo'), ['type' => 'number', 'inputmode' => 'decimal', 'min' => 0]) ?>
    <?= field_input('brief-budget', 'budget', t('forms.labels.budget'), ['placeholder' => t('forms.labels.budgetPlaceholder'), 'maxlength' => 120]) ?>
  </div>
  <fieldset class="mt-4">
    <legend class="mb-2 text-sm font-medium"><?= e(t('forms.labels.districts')) ?></legend>
    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <?php foreach (districts() as $slug => $name): ?>
      <?= field_checkbox('brief-d-' . $slug, 'districts[]', $name, ['value' => $slug, 'checked' => in_array($slug, $chosen, true)]) ?>
      <?php endforeach ?>
    </div>
  </fieldset>
<?php brief_step_end() ?>

<?php brief_step(3, t('search.steps.3.title'), t('search.steps.3.text')) ?>
  <?= field_textarea('brief-business', 'business', t('forms.labels.business'), ['placeholder' => t('forms.labels.businessPlaceholder'), 'rows' => 4, 'maxlength' => 200]) ?>
<?php brief_step_end() ?>

<?php brief_step(4, t('search.steps.4.title'), t('search.steps.4.text')) ?>
  <div class="grid gap-4 sm:grid-cols-2">
    <?= field_input('brief-name', 'name', t('forms.labels.name'), ['placeholder' => t('forms.labels.namePlaceholder'), 'autocomplete' => 'name', 'required' => true, 'maxlength' => 80]) ?>
    <?= field_phone('brief-phone', t('forms.labels.phone')) ?>
  </div>
<?php brief_step_end() ?>

<?= form_general_error_block() ?>
<div class="space-y-3">
<?= submit_button(t('search.submit')) ?>
<?= form_consent(t('search.note')) ?>
</div>
</form>
<?php
}

function brief_step(int $n, string $title, string $text): void
{
    ?>
<section aria-labelledby="step-<?= $n ?>" class="grid gap-4 md:grid-cols-[200px_1fr] md:gap-8" data-brief-step="<?= $n ?>">
  <div class="flex items-start gap-3">
    <span class="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink-muted transition-colors" data-brief-num="<?= $n ?>" aria-hidden="true"><?= $n ?></span>
    <div>
      <h2 id="step-<?= $n ?>" class="text-lg font-semibold"><?= e($title) ?></h2>
      <p class="text-sm text-ink-muted"><?= e($text) ?></p>
    </div>
  </div>
  <div>
<?php
}

function brief_step_end(): void
{
    echo "  </div>\n</section>\n";
}
