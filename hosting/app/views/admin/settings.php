<?php
/** Настройки: тексты главной, показатели, контакты, отзывы, пароль. */
declare(strict_types=1);

function admin_settings_page(string $method): void
{
    if ($method === 'POST') {
        csrf_check();
        admin_settings_save(post('form'));
    }

    $hero = setting_get('hero');
    $stats = setting_get('stats');
    $cnt = setting_get('contacts');
    $golden = setting_get('golden');
    $reviews = all_testimonials();

    admin_head(t('admin.settings.title'));
    admin_page_header(t('admin.settings.title'));
    ?>
<div class="space-y-6">

<form method="post" class="space-y-0">
<?= csrf_field() ?><input type="hidden" name="form" value="hero"/>
<?= admin_panel_open(t('admin.settings.hero.title')) ?>
<p class="mb-4 text-sm text-ink-muted"><?= e(t('admin.settings.hero.hint')) ?></p>
<div class="space-y-4">
  <?= field_input('s-hero-title', 'title', t('admin.settings.hero.heroTitle'), ['value' => (string) ($hero['title'] ?? ''), 'placeholder' => t('home.hero.title')]) ?>
  <?= field_textarea('s-hero-sub', 'subtitle', t('admin.settings.hero.heroSubtitle'), ['value' => (string) ($hero['subtitle'] ?? ''), 'rows' => 3, 'placeholder' => t('home.hero.subtitle')]) ?>
</div>
<div class="mt-4"><button type="submit" class="<?= e(btn('primary', 'md')) ?>"><?= e(t('admin.common.save')) ?></button></div>
<?= admin_panel_close() ?>
</form>

<form method="post">
<?= csrf_field() ?><input type="hidden" name="form" value="stats"/>
<?= admin_panel_open(t('admin.settings.stats.title')) ?>
<div class="grid gap-4 sm:grid-cols-2">
  <?= field_input('s-years', 'years', t('admin.settings.stats.years'), ['value' => (string) ($stats['years'] ?? ''), 'placeholder' => (string) agent('yearsInMarket')]) ?>
  <?= field_input('s-volume', 'volume', t('admin.settings.stats.volume'), ['value' => (string) ($stats['volume'] ?? ''), 'placeholder' => (string) agent('closedVolume')]) ?>
  <?= field_input('s-objects', 'objects', t('admin.settings.stats.objects'), ['value' => (string) ($stats['objects'] ?? ''), 'placeholder' => (string) agent('objectsInBase')]) ?>
  <?= field_input('s-avgdeal', 'avgDeal', t('admin.settings.stats.avgDeal'), ['value' => (string) ($stats['avgDeal'] ?? ''), 'placeholder' => (string) agent('avgDealDuration')]) ?>
</div>
<div class="mt-4"><button type="submit" class="<?= e(btn('primary', 'md')) ?>"><?= e(t('admin.common.save')) ?></button></div>
<?= admin_panel_close() ?>
</form>

<form method="post">
<?= csrf_field() ?><input type="hidden" name="form" value="contacts"/>
<?= admin_panel_open(t('admin.settings.contacts.title')) ?>
<p class="mb-4 text-sm text-ink-muted"><?= e(t('admin.settings.contacts.hint')) ?></p>
<div class="grid gap-4 sm:grid-cols-2">
  <?= field_input('s-phone', 'phone', t('admin.settings.contacts.phone'), ['value' => (string) ($cnt['phone'] ?? ''), 'placeholder' => (string) agent('phone')]) ?>
  <?= field_input('s-whatsapp', 'whatsapp', t('admin.settings.contacts.whatsapp'), ['value' => (string) ($cnt['whatsapp'] ?? ''), 'placeholder' => (string) agent('whatsapp')]) ?>
  <?= field_input('s-telegram', 'telegram', t('admin.settings.contacts.telegram'), ['value' => (string) ($cnt['telegram'] ?? ''), 'placeholder' => (string) agent('telegram')]) ?>
  <?= field_input('s-instagram', 'instagram', t('admin.settings.contacts.instagram'), ['value' => (string) ($cnt['instagram'] ?? ''), 'placeholder' => (string) agent('instagram')]) ?>
  <?= field_input('s-email', 'email', t('admin.settings.contacts.email'), ['value' => (string) ($cnt['email'] ?? ''), 'type' => 'email']) ?>
</div>
<div class="mt-4"><button type="submit" class="<?= e(btn('primary', 'md')) ?>"><?= e(t('admin.common.save')) ?></button></div>
<?= admin_panel_close() ?>
</form>

<form method="post">
<?= csrf_field() ?><input type="hidden" name="form" value="golden"/>
<?= admin_panel_open(t('admin.settings.golden.title')) ?>
<?= field_textarea('s-golden', 'text', t('admin.settings.golden.text'), ['value' => (string) ($golden['text'] ?? ''), 'rows' => 6, 'placeholder' => t('home.locations.text')]) ?>
<div class="mt-4"><button type="submit" class="<?= e(btn('primary', 'md')) ?>"><?= e(t('admin.common.save')) ?></button></div>
<?= admin_panel_close() ?>
</form>

<?= admin_panel_open(t('admin.settings.testimonials.title')) ?>
<?php if (!$reviews): ?>
<p class="mb-4 text-sm text-ink-muted"><?= e(t('admin.settings.testimonials.empty')) ?></p>
<?php else: ?>
<ul class="mb-6 space-y-4">
  <?php foreach ($reviews as $r): ?>
  <li class="rounded-base border border-line p-4">
    <form method="post" class="space-y-3">
      <?= csrf_field() ?><input type="hidden" name="form" value="testimonial"/><input type="hidden" name="id" value="<?= e($r['id']) ?>"/>
      <div class="grid gap-3 sm:grid-cols-[1fr_1fr_100px]">
        <?= field_input('r-author-' . $r['id'], 'author', t('admin.settings.testimonials.author'), ['value' => $r['author'], 'required' => true]) ?>
        <?= field_input('r-role-' . $r['id'], 'role', t('admin.settings.testimonials.role'), ['value' => (string) ($r['role'] ?? '')]) ?>
        <?= field_input('r-order-' . $r['id'], 'order', t('admin.settings.testimonials.order'), ['value' => (string) $r['order'], 'type' => 'number', 'min' => 0]) ?>
      </div>
      <?= field_textarea('r-text-' . $r['id'], 'text', t('admin.settings.testimonials.text'), ['value' => $r['text'], 'rows' => 3, 'required' => true]) ?>
      <?= field_checkbox('r-public-' . $r['id'], 'isPublic', t('admin.settings.testimonials.isPublic'), ['value' => '1', 'checked' => $r['isPublic']]) ?>
      <div class="flex gap-2">
        <button type="submit" class="<?= e(btn('secondary', 'sm')) ?>"><?= e(t('admin.common.save')) ?></button>
        <button type="submit" name="remove" value="1" class="<?= e(btn('ghost', 'sm', 'text-hot')) ?>" data-confirm-button="<?= e(t('admin.common.confirmDelete')) ?>"><?= e(t('admin.common.delete')) ?></button>
      </div>
    </form>
  </li>
  <?php endforeach ?>
</ul>
<?php endif ?>

<form method="post" class="space-y-3 rounded-base border border-dashed border-line p-4">
  <?= csrf_field() ?><input type="hidden" name="form" value="testimonial"/>
  <p class="text-sm font-semibold"><?= e(t('admin.settings.testimonials.add')) ?></p>
  <div class="grid gap-3 sm:grid-cols-[1fr_1fr_100px]">
    <?= field_input('r-author-new', 'author', t('admin.settings.testimonials.author'), ['value' => '', 'required' => true]) ?>
    <?= field_input('r-role-new', 'role', t('admin.settings.testimonials.role'), ['value' => '']) ?>
    <?= field_input('r-order-new', 'order', t('admin.settings.testimonials.order'), ['value' => '0', 'type' => 'number', 'min' => 0]) ?>
  </div>
  <?= field_textarea('r-text-new', 'text', t('admin.settings.testimonials.text'), ['value' => '', 'rows' => 3, 'required' => true]) ?>
  <?= field_checkbox('r-public-new', 'isPublic', t('admin.settings.testimonials.isPublic'), ['value' => '1', 'checked' => true]) ?>
  <button type="submit" class="<?= e(btn('primary', 'sm')) ?>"><?= e(t('admin.settings.testimonials.add')) ?></button>
</form>
<?= admin_panel_close() ?>

<form method="post">
<?= csrf_field() ?><input type="hidden" name="form" value="password"/>
<?= admin_panel_open('Пароль входа') ?>
<p class="mb-4 text-sm text-ink-muted">Минимум 8 символов. После смены вход по старому паролю перестанет работать.</p>
<div class="grid gap-4 sm:grid-cols-2">
  <div class="flex flex-col gap-1.5">
    <label for="s-pass" class="text-sm font-medium">Новый пароль</label>
    <input id="s-pass" name="password" type="password" autocomplete="new-password" minlength="8" class="<?= e(CONTROL_CLASS . ' h-11') ?>"/>
  </div>
  <div class="flex flex-col gap-1.5">
    <label for="s-pass2" class="text-sm font-medium">Повторите пароль</label>
    <input id="s-pass2" name="password2" type="password" autocomplete="new-password" minlength="8" class="<?= e(CONTROL_CLASS . ' h-11') ?>"/>
  </div>
</div>
<div class="mt-4"><button type="submit" class="<?= e(btn('primary', 'md')) ?>">Сменить пароль</button></div>
<?= admin_panel_close() ?>
</form>

</div>
<?php
    admin_foot();
}

/** Сохранение одной группы настроек. Пустое поле означает «брать значение по умолчанию». */
function admin_settings_save(string $form): void
{
    switch ($form) {
        case 'hero':
            setting_set('hero', ['title' => post('title'), 'subtitle' => post('subtitle')]);
            break;
        case 'stats':
            setting_set('stats', [
                'years' => post('years'),
                'volume' => post('volume'),
                'objects' => post('objects'),
                'avgDeal' => post('avgDeal'),
            ]);
            break;
        case 'contacts':
            $phone = post('phone');
            setting_set('contacts', [
                'phone' => $phone === '' ? '' : (normalize_phone($phone) ?? $phone),
                'whatsapp' => preg_replace('/\D/', '', post('whatsapp')) ?? '',
                'telegram' => post('telegram'),
                'instagram' => ltrim(post('instagram'), '@'),
                'email' => post('email'),
            ]);
            break;
        case 'golden':
            setting_set('golden', ['text' => post('text')]);
            break;
        case 'testimonial':
            $id = post('id') !== '' ? post('id') : null;
            if (post_bool('remove')) {
                if ($id !== null) {
                    delete_testimonial($id);
                    flash_set('Отзыв удалён');
                }
                break;
            }
            if (post('author') === '' || post('text') === '') {
                flash_set('Заполните автора и текст отзыва', 'error');
                break;
            }
            save_testimonial($id, post('author'), post('role') !== '' ? post('role') : null, post('text'), (int) (post_num('order') ?? 0), post_bool('isPublic'));
            break;
        case 'password':
            if (post('password') !== post('password2')) {
                flash_set('Пароли не совпадают', 'error');
                break;
            }
            if (!admin_set_password(post('password'))) {
                flash_set('Пароль должен быть не короче 8 символов', 'error');
                break;
            }
            flash_set('Пароль изменён');
            break;
    }
    if (flash_peek() === null) {
        flash_set(t('admin.settings.saved'));
    }
    redirect('/admin/settings', 303);
}
