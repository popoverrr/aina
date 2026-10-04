<?php
/**
 * Загрузка фотографий объектов.
 * Принимаем только настоящие изображения (проверка по содержимому, не по имени),
 * пересохраняем через GD — это убирает EXIF и любой посторонний код внутри файла,
 * и уменьшаем до разумного размера, чтобы страница объекта не весила мегабайты.
 */
declare(strict_types=1);

const IMAGE_MAX_WIDTH = 1600;
const IMAGE_MAX_BYTES = 12 * 1024 * 1024;

/**
 * Сохраняет один загруженный файл в uploads/ и возвращает
 * ['url' => '/uploads/...', 'width' => int, 'height' => int] или код ошибки в 'error'.
 */
function save_uploaded_image(array $file): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return ['error' => 'Файл не выбран'];
    }
    if (($file['error'] ?? 0) !== UPLOAD_ERR_OK) {
        return ['error' => 'Файл не загрузился, попробуйте снова'];
    }
    if (($file['size'] ?? 0) > IMAGE_MAX_BYTES) {
        return ['error' => 'Файл больше 12 МБ'];
    }
    $tmp = (string) ($file['tmp_name'] ?? '');
    if (!is_uploaded_file($tmp)) {
        return ['error' => 'Файл не загрузился, попробуйте снова'];
    }

    $info = @getimagesize($tmp);
    if (!$info) {
        return ['error' => 'Это не изображение'];
    }
    $source = match ($info[2]) {
        IMAGETYPE_JPEG => @imagecreatefromjpeg($tmp),
        IMAGETYPE_PNG => @imagecreatefrompng($tmp),
        IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($tmp) : false,
        default => false,
    };
    if (!$source) {
        return ['error' => 'Поддерживаются JPEG, PNG и WebP'];
    }

    $srcW = imagesx($source);
    $srcH = imagesy($source);
    $scale = $srcW > IMAGE_MAX_WIDTH ? IMAGE_MAX_WIDTH / $srcW : 1.0;
    $width = (int) round($srcW * $scale);
    $height = (int) round($srcH * $scale);

    $canvas = imagecreatetruecolor($width, $height);
    // Прозрачность PNG/WebP на фото не нужна и даёт чёрный фон — заливаем белым.
    imagefill($canvas, 0, 0, imagecolorallocate($canvas, 255, 255, 255));
    imagecopyresampled($canvas, $source, 0, 0, 0, 0, $width, $height, $srcW, $srcH);
    imagedestroy($source);

    if (!is_dir(UPLOADS_DIR)) {
        mkdir(UPLOADS_DIR, 0775, true);
    }
    $name = date('Y-m') . '-' . new_id() . '.jpg';
    $path = UPLOADS_DIR . '/' . $name;
    $saved = imagejpeg($canvas, $path, 82);
    imagedestroy($canvas);
    if (!$saved) {
        return ['error' => 'Не удалось сохранить файл'];
    }
    @chmod($path, 0644);

    return ['url' => '/uploads/' . $name, 'width' => $width, 'height' => $height];
}

/** Добавляет фото к объекту в конец галереи. */
function attach_property_image(string $propertyId, array $image, string $alt = ''): void
{
    $stmt = db()->prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM property_image WHERE property_id = ?');
    $stmt->execute([$propertyId]);
    $order = (int) $stmt->fetchColumn();
    db()->prepare('INSERT INTO property_image (id, property_id, url, alt, width, height, sort_order) VALUES (?,?,?,?,?,?,?)')
        ->execute([new_id(), $propertyId, $image['url'], $alt, (int) $image['width'], (int) $image['height'], $order]);
}

/** Удаление фото вместе с файлом — иначе uploads/ разрастается мусором. */
function delete_property_image(string $imageId): void
{
    $stmt = db()->prepare('SELECT url FROM property_image WHERE id = ?');
    $stmt->execute([$imageId]);
    $url = $stmt->fetchColumn();
    db()->prepare('DELETE FROM property_image WHERE id = ?')->execute([$imageId]);
    if (is_string($url) && str_starts_with($url, '/uploads/')) {
        $file = ROOT_DIR . $url;
        if (is_file($file)) {
            @unlink($file);
        }
    }
}

/** Перемещение фото в галерее: первое становится обложкой. */
function move_property_image(string $propertyId, string $imageId, int $direction): void
{
    $stmt = db()->prepare('SELECT id, sort_order FROM property_image WHERE property_id = ? ORDER BY sort_order ASC');
    $stmt->execute([$propertyId]);
    $rows = $stmt->fetchAll();
    $index = null;
    foreach ($rows as $i => $row) {
        if ($row['id'] === $imageId) {
            $index = $i;
            break;
        }
    }
    $target = $index === null ? null : $index + $direction;
    if ($target === null || $target < 0 || $target >= count($rows)) {
        return;
    }
    $update = db()->prepare('UPDATE property_image SET sort_order = ? WHERE id = ?');
    $update->execute([$target, $rows[$index]['id']]);
    $update->execute([$index, $rows[$target]['id']]);
}
