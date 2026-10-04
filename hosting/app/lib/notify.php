<?php
/**
 * Уведомления о новой заявке: Telegram и письмо.
 * Оба канала необязательны — если токен или адрес не заданы, заявка всё равно сохранена
 * и видна в панели, поэтому ошибка отправки никогда не ломает форму.
 */
declare(strict_types=1);

function notify_lead(array $data, string $leadId): void
{
    $text = lead_notification_text($data, $leadId);
    try {
        notify_telegram($text);
    } catch (Throwable $e) {
        log_error('telegram', $e->getMessage());
    }
    try {
        notify_email($text, $data);
    } catch (Throwable $e) {
        log_error('mail', $e->getMessage());
    }
}

function lead_notification_text(array $data, string $leadId): string
{
    $lines = [
        'Новая заявка с сайта: ' . lead_type_label($data['type']),
        'Имя: ' . $data['name'],
        'Телефон: ' . $data['phone'],
    ];
    if (filled($data['propertyId'])) {
        $p = find_property_by_id((string) $data['propertyId']);
        if ($p) {
            $lines[] = 'Объект: ' . $p['title'] . ' (' . abs_url('/objects/' . $p['slug']) . ')';
        }
    }
    if (filled($data['briefKind'])) {
        $lines[] = 'Тип помещения: ' . kind_label((string) $data['briefKind']);
    }
    if ($data['briefAreaFrom'] !== null || $data['briefAreaTo'] !== null) {
        $lines[] = 'Площадь: ' . trim(($data['briefAreaFrom'] !== null ? fmt_area($data['briefAreaFrom']) : '') . ' – ' . ($data['briefAreaTo'] !== null ? fmt_area($data['briefAreaTo']) : ''));
    }
    if (filled($data['briefBudget'])) {
        $lines[] = 'Бюджет: ' . $data['briefBudget'];
    }
    if (!empty($data['briefDistricts'])) {
        $lines[] = 'Районы: ' . implode(', ', $data['briefDistricts']);
    }
    if (filled($data['briefBusiness'])) {
        $lines[] = 'Бизнес: ' . $data['briefBusiness'];
    }
    if (filled($data['comment'])) {
        $lines[] = 'Комментарий: ' . $data['comment'];
    }
    $lines[] = 'Панель: ' . abs_url('/admin/leads');
    return implode("\n", $lines);
}

function notify_telegram(string $text): void
{
    $token = (string) cfg('telegram_bot_token', '');
    $chat = (string) cfg('telegram_chat_id', '');
    if ($token === '' || $chat === '') {
        return;
    }
    $url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
    $payload = json_encode(['chat_id' => $chat, 'text' => $text, 'disable_web_page_preview' => true], JSON_UNESCAPED_UNICODE);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
        ]);
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);
        if ($response === false) {
            throw new RuntimeException($error === '' ? 'curl failed' : $error);
        }
        return;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => 8,
            'ignore_errors' => true,
        ],
    ]);
    if (@file_get_contents($url, false, $context) === false) {
        throw new RuntimeException('telegram request failed');
    }
}

function notify_email(string $text, array $data): void
{
    $to = (string) cfg('admin_email', '');
    if ($to === '' || !function_exists('mail')) {
        return;
    }
    $subject = 'Заявка с сайта: ' . lead_type_label($data['type']) . ' — ' . $data['name'];
    $headers = implode("\r\n", [
        'From: ' . site_host_sender(),
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]);
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    if (!@mail($to, $encodedSubject, $text, $headers)) {
        throw new RuntimeException('mail() вернула false');
    }
}

/** Адрес отправителя на домене сайта — иначе письмо почти всегда уходит в спам. */
function site_host_sender(): string
{
    $host = parse_url(site_url(), PHP_URL_HOST) ?: ($_SERVER['HTTP_HOST'] ?? 'localhost');
    return 'Сайт <no-reply@' . preg_replace('/^www\./', '', (string) $host) . '>';
}

/** Ошибки внешних сервисов пишем в файл: заказчику они не нужны, нам — нужны. */
function log_error(string $channel, string $message): void
{
    $line = date('c') . "\t" . $channel . "\t" . str_replace(["\r", "\n"], ' ', $message) . "\n";
    @file_put_contents(DATA_DIR . '/errors.log', $line, FILE_APPEND);
}
