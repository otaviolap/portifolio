import "server-only";
import { prisma } from "@/lib/prisma";

// DTO plano: nada de Date/Decimal cruzando a fronteira RSC→client.
// Só os campos que o grid público precisa.
export type ProjectCardDTO = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  coverAlt: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  coverBlurData: string | null;
  liveUrl: string | null;
  year: number | null;
  featured: boolean;
};

/** Projetos publicados, ordenados — a query da home/grid (index-only em [status, order]). */
export async function getPublishedProjects(): Promise<ProjectCardDTO[]> {
  const rows = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      coverUrl: true,
      coverAlt: true,
      coverWidth: true,
      coverHeight: true,
      coverBlurData: true,
      liveUrl: true,
      year: true,
      featured: true,
    },
  });
  return rows;
}
