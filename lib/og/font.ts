import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * Шрифт для динамических OG-картинок (satori не умеет woff2 и не имеет кириллицы по умолчанию).
 * Inter SemiBold, лицензия OFL. Файл подхватывается сборкой через new URL(..., import.meta.url);
 * в Node-рантайме это file:// — читаем через fs (fetch для file:// в Node не реализован).
 */
export async function loadOgFont(): Promise<ArrayBuffer> {
  const url = new URL("./Inter-SemiBold.ttf", import.meta.url);
  if (url.protocol === "file:") {
    const buffer = await readFile(fileURLToPath(url));
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }
  const response = await fetch(url);
  return response.arrayBuffer();
}
