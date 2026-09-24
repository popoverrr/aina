/**
 * Генерация bcrypt-хеша для ADMIN_PASSWORD_HASH.
 *
 *   npm run hash-password -- "мой пароль"
 *
 * Печатает две строки:
 *   1) чистый хеш — для панели переменных окружения Vercel (вставлять как есть);
 *   2) готовую строку для .env.local — с экранированными `\$`, потому что Next.js
 *      раскрывает `$ИМЯ` в .env-файлах и без экранирования хеш обрезается.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Использование: npm run hash-password -- "пароль"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const escaped = hash.split("$").join("\\$");

console.log("Хеш (для Vercel / панели хостинга):");
console.log(hash);
console.log("");
console.log("Строка для .env.local:");
console.log(`ADMIN_PASSWORD_HASH="${escaped}"`);
