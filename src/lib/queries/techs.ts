import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type TechDTO = {
  id: string;
  slug: string;
  name: string;
  category: string;
  color: string | null;
  order: number;
};

/** Todas as techs, ordenadas por categoria+order. Cacheada com tag 'techs'. */
export const getAllTechs = unstable_cache(
  async (): Promise<TechDTO[]> => {
    return prisma.tech.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        color: true,
        order: true,
      },
    });
  },
  ["all-techs"],
  { tags: ["techs"] },
);
