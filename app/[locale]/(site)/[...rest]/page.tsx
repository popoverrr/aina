import { notFound } from "next/navigation";

/** Любой путь, не совпавший с реальной страницей, — 404 внутри локали (с шапкой и подвалом не-нужно: 404 общая). */
export default function CatchAllPage() {
  notFound();
}
