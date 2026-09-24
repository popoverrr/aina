/**
 * Локальный PostgreSQL для разработки без установки сервера в систему.
 * Использует пакет embedded-postgres (бинарники PostgreSQL ставятся вместе с npm install).
 *
 *   npm run db:local
 *
 * Данные лежат в ./.pgdata (в .gitignore). Порт — LOCAL_PG_PORT или 5433.
 * Строка подключения для .env.local:
 *   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/ayna"
 */
import { existsSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const PORT = Number(process.env.LOCAL_PG_PORT ?? 5433);
const DB_NAME = "ayna";
const DATA_DIR = path.resolve(".pgdata");

async function main(): Promise<void> {
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: "postgres",
    password: "postgres",
    port: PORT,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
  });

  if (!existsSync(path.join(DATA_DIR, "PG_VERSION"))) {
    console.log("Инициализация кластера в", DATA_DIR);
    await pg.initialise();
  }

  await pg.start();

  try {
    await pg.createDatabase(DB_NAME);
    console.log(`База ${DB_NAME} создана.`);
  } catch {
    // база уже есть — нормальный случай при повторном запуске
  }

  console.log(
    `PostgreSQL запущен: postgresql://postgres:postgres@127.0.0.1:${PORT}/${DB_NAME}\n` +
      "Остановить: Ctrl+C",
  );

  const stop = async (): Promise<void> => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());
}

main().catch((error: unknown) => {
  console.error("Не удалось запустить локальный PostgreSQL:", error);
  process.exit(1);
});
