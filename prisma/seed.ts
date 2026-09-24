/**
 * Демо-данные для разработки: 8 объектов, 3 кейса, 3 отзыва. Все помечены isDemo: true
 * и явно подписаны «Демо» в заголовках — это НЕ реальные факты, их нужно заменить в админке.
 *
 *   npm run db:seed
 *
 * Скрипт идемпотентен: объекты и кейсы upsert'ятся по slug, демо-отзывы пересоздаются.
 * Удалить все демо-записи: npm run db:seed -- --clean
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../lib/generated/prisma/client";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const DEMO_PREFIX = "demo-";
const DEMO_AUTHOR_PREFIX = "Демо-отзыв";

type DemoProperty = Prisma.PropertyCreateInput & { isDemo: true };
type DemoCase = Prisma.CaseCreateInput & { isDemo: true };
type DemoTestimonial = Prisma.TestimonialCreateInput & { isDemo: true };

const DEMO_DESCRIPTION =
  "Это демонстрационный объект. Описание, цена и параметры выдуманы для проверки вёрстки и фильтров.\n\n" +
  "Замените его реальным объектом в админке или удалите: npm run db:seed -- --clean.";

const properties: DemoProperty[] = [
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}street-retail-120`,
    title: "Демо: стрит-ритейл 120 м² на первой линии",
    kind: "RETAIL",
    dealType: "RENT",
    status: "ACTIVE",
    district: "Медеуский",
    address: "Демо-адрес, не показывается публично для эксклюзивов",
    landmark: "Демо-ориентир: рядом с крупным ТРЦ",
    areaM2: 120,
    ceilingM: 3.6,
    floor: "1",
    entrance: "отдельный вход с улицы",
    powerKw: 25,
    hasWetPoint: true,
    priceRentM2: 7500,
    priceRentTotal: 900000,
    utilitiesIncluded: false,
    isHot: true,
    isFeatured: true,
    descriptionMd: DEMO_DESCRIPTION,
    advantages: ["Демо: витринное остекление", "Демо: отдельный вход", "Демо: мокрая точка есть"],
    publishedAt: new Date(),
  },
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}office-85`,
    title: "Демо: офис 85 м² в бизнес-центре",
    kind: "OFFICE",
    dealType: "RENT",
    status: "ACTIVE",
    district: "Бостандыкский",
    landmark: "Демо-ориентир: деловой квартал",
    areaM2: 85,
    ceilingM: 3,
    floor: "7",
    entrance: "через ресепшн бизнес-центра",
    powerKw: 10,
    priceRentM2: 6000,
    priceRentTotal: 510000,
    utilitiesIncluded: true,
    descriptionMd: DEMO_DESCRIPTION,
    advantages: ["Демо: свежий ремонт", "Демо: паркинг", "Демо: коммуналка включена"],
    publishedAt: new Date(),
  },
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}retail-exclusive-200`,
    title: "Демо: закрытый объект, стрит-ритейл 200 м²",
    kind: "RETAIL",
    dealType: "SALE",
    status: "ACTIVE",
    district: "Алмалинский",
    address: "СЕКРЕТНЫЙ-ДЕМО-АДРЕС — не должен попасть в HTML без заявки",
    landmark: "Демо-ориентир: пешеходная улица в центре",
    areaM2: 200,
    ceilingM: 4,
    floor: "1",
    entrance: "отдельный вход с улицы",
    powerKw: 40,
    hasWetPoint: true,
    priceSale: 380000000,
    isExclusive: true,
    isHot: true,
    isFeatured: true,
    descriptionMd: DEMO_DESCRIPTION,
    advantages: ["Демо: действующий арендатор", "Демо: угловое расположение", "Демо: две витрины"],
    presentationUrl: "https://example.com/demo-presentation.pdf",
    publishedAt: new Date(),
  },
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}warehouse-600`,
    title: "Демо: склад 600 м² с пандусом",
    kind: "WAREHOUSE",
    dealType: "RENT",
    status: "ACTIVE",
    district: "Жетысуский",
    landmark: "Демо-ориентир: рядом с кольцевой",
    areaM2: 600,
    ceilingM: 8,
    floor: "1",
    powerKw: 100,
    priceRentM2: 2500,
    priceRentTotal: 1500000,
    descriptionMd: DEMO_DESCRIPTION,
    advantages: ["Демо: пандус", "Демо: круглосуточный доступ", "Демо: охраняемая территория"],
    publishedAt: new Date(),
  },
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}land-15`,
    title: "Демо: участок 15 соток под коммерцию",
    kind: "LAND",
    dealType: "SALE",
    status: "ACTIVE",
    district: "Наурызбайский",
    landmark: "Демо-ориентир: вдоль трассы",
    areaM2: 1500,
    priceSale: 150000000,
    descriptionMd: DEMO_DESCRIPTION,
    advantages: ["Демо: целевое назначение — коммерция", "Демо: коммуникации по границе"],
    publishedAt: new Date(),
  },
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}building-1200`,
    title: "Демо: отдельно стоящее здание 1 200 м²",
    kind: "BUILDING",
    dealType: "BOTH",
    status: "ACTIVE",
    district: "Ауэзовский",
    landmark: "Демо-ориентир: перекрёсток двух проспектов",
    areaM2: 1200,
    ceilingM: 3.4,
    floor: "1-3",
    entrance: "отдельный вход с улицы",
    powerKw: 150,
    hasWetPoint: true,
    priceSale: 900000000,
    priceRentTotal: 6000000,
    isHot: true,
    descriptionMd: DEMO_DESCRIPTION,
    advantages: ["Демо: собственная парковка", "Демо: три этажа", "Демо: лифт"],
    publishedAt: new Date(),
  },
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}retail-reserved-60`,
    title: "Демо: помещение 60 м² (забронировано)",
    kind: "RETAIL",
    dealType: "RENT",
    status: "RESERVED",
    district: "Медеуский",
    landmark: "Демо-ориентир: у метро",
    areaM2: 60,
    floor: "цоколь",
    priceRentM2: 5000,
    priceRentTotal: 300000,
    descriptionMd: DEMO_DESCRIPTION,
    advantages: ["Демо: высокий трафик"],
    publishedAt: new Date(),
  },
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}office-300-featured`,
    title: "Демо: офисный блок 300 м² с отделкой",
    kind: "OFFICE",
    dealType: "SALE",
    status: "ACTIVE",
    district: "Алмалинский",
    landmark: "Демо-ориентир: центр города",
    areaM2: 300,
    ceilingM: 3.2,
    floor: "4",
    powerKw: 30,
    priceSale: 240000000,
    isFeatured: true,
    descriptionMd: DEMO_DESCRIPTION,
    advantages: ["Демо: отделка под ключ", "Демо: панорамные окна", "Демо: два санузла"],
    publishedAt: new Date(),
  },
];

const cases: DemoCase[] = [
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}case-retail-rent`,
    title: "Демо-кейс: сдача стрит-ритейла под кофейню",
    kind: "RETAIL",
    dealType: "RENT",
    district: "Медеуский",
    areaM2: 95,
    amountLabel: "Демо: 800 тыс. ₸ в месяц",
    durationLabel: "Демо: 3 недели",
    task: "Демонстрационный текст задачи. Заменить реальным кейсом в админке.",
    solution: "Демонстрационный текст решения.",
    result: "Демонстрационный результат с цифрой: срок и ставка выдуманы.",
    isFeatured: true,
    order: 1,
  },
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}case-office-sale`,
    title: "Демо-кейс: продажа офисного блока инвестору",
    kind: "OFFICE",
    dealType: "SALE",
    district: "Бостандыкский",
    areaM2: 220,
    durationLabel: "Демо: 1,5 месяца",
    task: "Демонстрационный текст задачи. Сумма сделки намеренно не указана — проверка вёрстки без amountLabel.",
    solution: "Демонстрационный текст решения.",
    result: "Демонстрационный результат.",
    isFeatured: true,
    order: 2,
  },
  {
    isDemo: true,
    slug: `${DEMO_PREFIX}case-land`,
    title: "Демо-кейс: участок под АЗС",
    kind: "LAND",
    dealType: "SALE",
    district: "Наурызбайский",
    areaM2: 2000,
    amountLabel: "Демо: сумма не раскрывается",
    durationLabel: "Демо: 2 месяца",
    task: "Демонстрационный текст задачи.",
    solution: "Демонстрационный текст решения.",
    result: "Демонстрационный результат.",
    isFeatured: true,
    order: 3,
  },
];

const testimonials: DemoTestimonial[] = [
  {
    isDemo: true,
    author: `${DEMO_AUTHOR_PREFIX} 1 (заменить)`,
    role: "демо: собственник помещения",
    text: "Это демонстрационный отзыв. Замените его реальным в админке: Настройки → Отзывы.",
    order: 1,
  },
  {
    isDemo: true,
    author: `${DEMO_AUTHOR_PREFIX} 2 (заменить)`,
    role: "демо: арендатор",
    text: "Это демонстрационный отзыв. Блок отзывов на сайте показывается, только если отзывов два и больше.",
    order: 2,
  },
  {
    isDemo: true,
    author: `${DEMO_AUTHOR_PREFIX} 3 (заменить)`,
    role: "демо: инвестор",
    text: "Это демонстрационный отзыв. Реальные отзывы и имена клиентов берутся только из базы.",
    order: 3,
  },
];

function strip<T extends { isDemo: true }>(item: T): Omit<T, "isDemo"> {
  const { isDemo: _isDemo, ...rest } = item;
  void _isDemo;
  return rest;
}

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    if (process.argv.includes("--clean")) {
      const p = await prisma.property.deleteMany({ where: { slug: { startsWith: DEMO_PREFIX } } });
      const c = await prisma.case.deleteMany({ where: { slug: { startsWith: DEMO_PREFIX } } });
      const t = await prisma.testimonial.deleteMany({ where: { author: { startsWith: DEMO_AUTHOR_PREFIX } } });
      console.log(`Удалено демо-записей: объектов ${p.count}, кейсов ${c.count}, отзывов ${t.count}`);
      return;
    }

    for (const item of properties) {
      const data = strip(item);
      await prisma.property.upsert({ where: { slug: data.slug }, create: data, update: data });
    }
    for (const item of cases) {
      const data = strip(item);
      await prisma.case.upsert({ where: { slug: data.slug }, create: data, update: data });
    }
    await prisma.testimonial.deleteMany({ where: { author: { startsWith: DEMO_AUTHOR_PREFIX } } });
    await prisma.testimonial.createMany({ data: testimonials.map(strip) });

    console.log(`Демо-данные загружены: ${properties.length} объектов, ${cases.length} кейсов, ${testimonials.length} отзыва.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
