import "server-only";
import { prisma } from "@/lib/db";
import { cachedQuery, TAGS } from "@/lib/cache";

export interface TestimonialDto {
  id: string;
  author: string;
  role: string | null;
  text: string;
}

export const getPublicTestimonials = cachedQuery(
  async (): Promise<TestimonialDto[]> => {
    const rows = await prisma.testimonial.findMany({
      where: { isPublic: true },
      orderBy: { order: "asc" },
      select: { id: true, author: true, role: true, text: true },
    });
    return rows;
  },
  ["testimonials-public"],
  [TAGS.testimonials],
  [],
);
