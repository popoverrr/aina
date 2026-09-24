# Сайт эксперта по коммерческой недвижимости (Алматы)

Персональный сайт по ТЗ `SPEC.md`: Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, PostgreSQL + Prisma 7,
Auth.js v5, react-hook-form + zod, next-intl, Vercel Blob, lucide-react. Решения по ходу — в `DECISIONS.md`.

## Содержание

1. [Установка](#установка)
2. [Переменные окружения](#переменные-окружения)
3. [Запуск](#запуск)
4. [Как править контент](#как-править-контент)
5. [Как добавить объект](#как-добавить-объект)
6. [Импорт выгрузки из CRM «РБД»](#импорт-выгрузки-из-crm-рбд)
7. [Превью на GitHub Pages](#превью-на-github-pages)
8. [Деплой на Vercel](#деплой-на-vercel)
9. [Структура проекта](#структура-проекта)
10. [Проверки качества](#проверки-качества)

## Установка

Нужен Node.js 20.9+ (проверялось на 24). PostgreSQL ставить не обязательно — есть локальный.

```bash
npm install
cp .env.example .env.local        # и заполнить, см. ниже
npm run db:local                  # локальный PostgreSQL в отдельном терминале (Ctrl+C — остановить)
npm run db:migrate                # применить миграции
npm run db:seed                   # демо-данные: 8 объектов, 3 кейса, 3 отзыва (все подписаны «Демо»)
npm run dev                       # http://localhost:3000
```

Локальная база: `npm run db:local` поднимает PostgreSQL из пакета `embedded-postgres` (данные в `.pgdata/`,
порт 5433) и печатает строку подключения — она же по умолчанию в `.env.example`.

Удалить демо-данные: `npm run db:seed -- --clean`.

## Переменные окружения

Все переменные описаны в `.env.example` с комментариями. Реальные значения — только в `.env.local` (в `.gitignore`).

| Переменная | Обязательна | Что делает |
|---|---|---|
| `DATABASE_URL` | да | PostgreSQL (локально — из `npm run db:local`, прод — Neon/Supabase) |
| `AUTH_SECRET` | да | секрет JWT-сессии админки: `npx auth secret` или `openssl rand -base64 32` |
| `ADMIN_EMAIL` | да | логин единственного администратора |
| `ADMIN_PASSWORD_HASH` | да | bcrypt-хеш: `npm run hash-password -- "пароль"` печатает готовую строку. В `.env`-файле каждый `$` хеша экранируется как `\$` (Next раскрывает `$ИМЯ`); в панели Vercel — хеш как есть |
| `BLOB_READ_WRITE_TOKEN` | для прода | Vercel Blob для фото. Без него в development файлы пишутся в `public/uploads/` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | нет | уведомления о заявках; без них отключены |
| `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` | нет | дублирование заявок в таблицу; без них отключено |
| `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_METRIKA_ID` | нет | счётчики; без них скрипты не подключаются |
| `NEXT_PUBLIC_SITE_URL` | да | публичный адрес для canonical/sitemap/OG |

Все необязательные интеграции отключаются сами, если переменных нет: сборка и заявки работают.

### Telegram

1. Создать бота через @BotFather → токен в `TELEGRAM_BOT_TOKEN`.
2. Написать боту любое сообщение, затем открыть `https://api.telegram.org/bot<токен>/getUpdates` и взять `chat.id` → `TELEGRAM_CHAT_ID`.

### Google Sheets

1. В Google Cloud создать сервисный аккаунт, скачать JSON-ключ.
2. `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `private_key` → `GOOGLE_PRIVATE_KEY` (одной строкой, переводы строк как `\n`).
3. Дать этому email доступ «Редактор» к таблице; ID таблицы из URL → `GOOGLE_SHEETS_ID`.
   Колонки: дата, тип заявки, имя, телефон, объект, комментарий, UTM-источник, UTM-кампания, страница.

## Запуск

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | прод-сервер после сборки |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:local` | локальный PostgreSQL |
| `npm run db:migrate` | `prisma migrate dev` (создать/применить миграции локально) |
| `npm run db:deploy` | `prisma migrate deploy` (прод) |
| `npm run db:seed` | демо-данные (`-- --clean` — удалить) |
| `npm run hash-password -- "пароль"` | bcrypt-хеш для `ADMIN_PASSWORD_HASH` |
| `npm run import -- ./data/export.csv [--dry-run]` | импорт из CRM |

Админка: `http://localhost:3000/admin` (логин и пароль — из `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`).

## Как править контент

- **Данные заказчика** (имя, телефон, соцсети, реквизиты, цифры) — `site.config.ts`. Незаполненные значения
  выводятся на сайте как заметная заглушка `[ЗАПОЛНИТЬ: …]`. Полный список дыр — в конце `DECISIONS.md`.
- **Все тексты интерфейса и страниц** — `messages/ru.json` (одна вложенная структура по разделам: `home`, `about`,
  `owners`, `objects`, `forms`, `admin`…). В компонентах захардкоженных строк нет.
- **Через админку** (`/admin/settings`): заголовок и подзаголовок первого экрана, четыре цифры в полосе показателей,
  контакты, текст блока «Золотой квадрат», отзывы. Пустое поле = значение по умолчанию из словаря/конфига.
- **Объекты и кейсы** — `/admin/objects`, `/admin/cases`. **Заявки** — `/admin/leads` (фильтры, смена статуса, CSV).
- **Изображения**: портрет и OG-картинка уже в `public/`. Кадры с объектов для `/about` — положить как
  `public/agent/work/1.jpg … 6.jpg`, они подхватятся автоматически (пока их нет — видимая заглушка).
- **Казахская версия** (этап 2): добавить `"kk"` в `site.site.locales`, заполнить `messages/kk.json`
  (недостающие ключи берутся из `ru`), включить `features.localeKk` в `lib/features.ts`. URL уже готов: `/kk/...`.
- **Калькулятор** (этап 2): точка расширения — `components/objects/CalculatorPlaceholder.tsx` и флаг `features.calculator`.

## Как добавить объект

1. `/admin/objects` → «Новый объект». Заполнить название (slug сгенерируется транслитерацией, его можно править —
   уникальность проверяется на лету), тип, сделку, район, площадь, цены, описание, преимущества (по одному на строку).
2. Флаги: «Горящий» — попадёт в блок «Горящие варианты» на главной; «На главной» — приоритет в выдаче;
   «Закрытый объект» — публично видны только тип, район, диапазон площади, ориентир и «цена по запросу»;
   адрес, цена, презентация и фото интерьера открываются посетителю после заявки по этому объекту.
3. «Создать» → откроется страница редактирования, где появится блок фото: перетащить файлы (JPG/PNG/WebP/HEIC),
   на сервере они сжимаются до 2000px и конвертируются в WebP, оригинал не хранится. Порядок — перетаскиванием
   или стрелками; первое фото — обложка. Подпись alt редактируется под каждым фото.
   Локально без `BLOB_READ_WRITE_TOKEN` загрузка работает только в `npm run dev` (файлы кладутся в `public/uploads/`);
   в `npm run start`/на проде без токена она отключена с сообщением в админке.
4. Быстрые действия из таблицы объектов: переключить «Горящий»/«На главной», сменить статус — без захода в карточку.
5. Черновик формы автоматически сохраняется в браузере: при случайном закрытии его предложат восстановить.

## Импорт выгрузки из CRM «РБД»

```bash
npm run import -- ./data/export.csv --dry-run   # показать, что изменится
npm run import -- ./data/export.csv             # применить
```

Пример файла в ожидаемом формате (разделитель `;`, UTF-8): `data/example-export.csv`.

- **Формат реальной выгрузки неизвестен.** Соответствие колонок задаётся в одном файле — `scripts/crm-mapping.ts`
  (названия колонок, разделитель, кодировка, словари значений «тип объекта / сделка / статус»). Правится под
  фактический CSV; больше ничего трогать не нужно.
- Идемпотентность по `externalId`: существующие объекты обновляются (slug не меняется, ссылки живут), новые создаются.
  Повторный запуск не плодит дубли.
- Объекты **никогда не удаляются**: отсутствующие в выгрузке переводятся в статус `HIDDEN`, список печатается в консоль.
  Объекты, созданные вручную в админке (без `externalId`), импорт не трогает.
- Отчёт в конце: создано / обновлено / скрыто / ошибок (строки с ошибками пропускаются, остальные применяются).

## Превью на GitHub Pages

Витрина для показа заказчику: **https://popoverrr.github.io/aina/**

Это статичный снимок публичных страниц, снятый с настоящего сервера, — вёрстка и содержимое
совпадают с рабочим сайтом, данные демонстрационные. Пересобрать и обновить:

```bash
npm run db:local      # в отдельном терминале: страницы рендерятся из базы
npm run preview:build # сборка с префиксом /aina + снимок в out-preview/
```

Затем содержимое `out-preview/` публикуется в ветку `gh-pages` (Settings → Pages → Deploy from
a branch → `gh-pages` / root):

```bash
cd out-preview && git init -b gh-pages && git add -A && git commit -m "preview" \
  && git push --force https://github.com/popoverrr/aina.git gh-pages
```

**Чего в превью нет и быть не может** — это статика без сервера и базы:

- отправка форм (Server Actions): по кнопке показывается пояснение вместо заявки;
- фильтры каталога и «Показать ещё»: выборка считается на сервере по `searchParams`;
- админка, вход и загрузка фото;
- оптимизация картинок `next/image` (в превью она отключена, отдаются исходные файлы).

Превью закрыто от индексации: `noindex` на каждой странице и запрещающий `robots.txt`.
Полноценно рабочая версия живёт на Vercel — см. следующий раздел.

## Деплой на Vercel

1. База: создать проект в [Neon](https://neon.tech) (или Supabase), взять строку подключения.
2. Vercel → New Project → импорт репозитория. Build Command по умолчанию (`npm run build`, внутри `prisma generate`).
3. Storage → Blob → создать хранилище; токен `BLOB_READ_WRITE_TOKEN` добавится в переменные проекта.
4. Environment Variables: все обязательные из таблицы выше (+ Telegram/Sheets/аналитика по желанию),
   `NEXT_PUBLIC_SITE_URL=https://домен.kz`.
5. Миграции на прод: локально `DATABASE_URL="<neon>" npm run db:deploy` (или добавить `prisma migrate deploy`
   в Build Command перед `next build`).
6. После деплоя: заполнить `site.config.ts`, загрузить объекты, в Instagram поставить ссылку на сайт с UTM
   (`https://домен.kz/?utm_source=instagram&utm_medium=bio`) — иначе трафик из профиля не измеряется.

Шрифт Inter подключён через `next/font` и скачивается на этапе сборки — на рантайме запросов к Google нет.

## Структура проекта

```
app/
  [locale]/
    layout.tsx            корневой layout: шрифт, провайдер словарей, аналитика
    (site)/               публичный сайт: шапка, подвал, плавающий WhatsApp
      page.tsx            главная
      about/ cases/ objects/ owners/ search/ contacts/ privacy/ thanks/
      objects/[slug]/opengraph-image.tsx   динамическая OG-картинка
      [...rest]/          404 внутри локали
    admin/                админка: свой layout без шапки/подвала
  api/auth/[...nextauth]  Auth.js
  api/admin/leads-export  CSV
  sitemap.ts robots.ts
components/   ui/ (Button, Field, Badge, Card, Skeleton, Section, Breadcrumbs, Placeholder), layout/, home/, objects/, cases/, forms/, admin/
lib/
  db.ts                   Prisma-клиент (adapter-pg)
  properties.ts           publicPropertySelect, toPublicProperty, фильтры каталога
  cases.ts testimonials.ts settings.ts leads.ts
  actions/leads.ts        Server Action всех форм (zod → UTM → БД → Telegram/Sheets → redirect)
  actions/admin.ts        Server Actions админки
  validation/lead.ts      zod-схемы форм (клиент + сервер)
  validation/admin.ts     zod-схемы админки
  notify/telegram.ts notify/sheets.ts
  storage.ts images.ts    хранилище (Vercel Blob / локально) и обработка фото (sharp)
  utm.ts rate-limit.ts unlock.ts format.ts slug.ts districts.ts markdown.ts cache.ts
i18n/                     routing, request, navigation (next-intl)
messages/ru.json          все тексты; messages/kk.json — заготовка
prisma/schema.prisma prisma/seed.ts prisma/migrations/
scripts/                  import-crm.ts, crm-mapping.ts, hash-password.ts, dev-db.ts
proxy.ts                  middleware Next 16: UTM-cookie, защита /admin, локали
site.config.ts            переменные проекта
```

## Проверки качества

```bash
npm run typecheck && npm run lint && npm run build
```

Lighthouse (mobile) — по собранному сайту `npm run build && npm run start`, Chrome DevTools → Lighthouse,
эмуляция Moto G Power / 4G. Целевые значения из ТЗ: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.

Замер 15.09.2026 на локальной машине разработчика (Windows, headless Edge, `next start`, демо-данные без фото,
Lighthouse 12, mobile-пресет с симуляцией 4G и 4× замедления CPU). Accessibility, Best Practices и SEO — 100 на всех
страницах. Performance колеблется от запуска к запуску на ±5 из-за нагрузки на машину:

| Страница | Performance | LCP | CLS | TBT |
|---|---|---|---|---|
| `/` | 88–90 | 3,5–3,6 с | 0 | 90–150 мс |
| `/objects` | 89–91 | 3,4–3,8 с | 0 | 50–150 мс |
| `/objects/[slug]` | 84–91 | 3,4–3,7 с | 0,003 | 90–260 мс |
| `/about` | 84–88 | 3,3–3,4 с | 0 | 210–350 мс |
| `/cases` | 90–95 | 3,0–3,5 с | 0 | 60–290 мс |
| `/owners` | 82–85 | 3,4–3,5 с | 0 | 290–380 мс |
| `/search` | 72–80 | 3,6–4,0 с | 0 | 420–490 мс |
| `/contacts` | 78–89 | 3,0–3,1 с | 0 | 290–610 мс |

Что сделано ради этих цифр — в `DECISIONS.md`, раздел «Производительность». LCP везде — портрет или первый абзац,
и ограничен сетевым критическим путём (HTML + CSS + два подмножества шрифта + картинка) при симуляции 4G;
на Vercel (CDN, HTTP/2, AVIF) значения обычно выше локальных. Остаток TBT — гидрация рантайма React/Next,
общего для всех страниц; страница `/search` тяжелее из-за бриф-формы, которая по смыслу интерактивна сразу.
Локальный запуск замера: `CHROME_PATH="…\msedge.exe" npx lighthouse http://localhost:3000/ --output=html`.

Проверка закрытого объекта: открыть страницу эксклюзивного объекта → «Просмотр кода страницы» → в HTML нет адреса,
цены и ссылки на презентацию. После отправки формы «Запросить презентацию» на этом объекте они появляются.
