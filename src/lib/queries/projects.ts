import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// DTO plano: nada de Date/Decimal cruzando a fronteira RSC→client.
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

/**
 * Projetos publicados, ordenados. Cacheada com tag 'projects' → as Server
 * Actions do admin chamam revalidateTag('projects') e o site reflete sem
 * rebuild. É o que neutraliza o cold start da Neon no público.
 */
export const getPublishedProjects = unstable_cache(
  async (): Promise<ProjectCardDTO[]> => {
    return prisma.project.findMany({
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
  },
  ["published-projects"],
  { tags: ["projects"] },
);

// ---------------------------------------------------------------- ADMIN
// NÃO cacheadas — o admin sempre precisa do estado fresco.

export type ProjectListItemDTO = {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  order: number;
  year: number | null;
  coverUrl: string | null;
};

export async function getAllProjectsAdmin(): Promise<ProjectListItemDTO[]> {
  return prisma.project.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      featured: true,
      order: true,
      year: true,
      coverUrl: true,
    },
  });
}

export type ProjectEditDTO = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  clientName: string | null;
  year: number | null;
  role: string | null;
  featured: boolean;
  status: string;
  coverUrl: string | null;
  coverPathname: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  coverBlurData: string | null;
  coverAlt: string | null;
  techIds: string[];
};

export async function getProjectByIdAdmin(
  id: string,
): Promise<ProjectEditDTO | null> {
  const p = await prisma.project.findUnique({
    where: { id },
    include: { techs: { select: { techId: true } } },
  });
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    description: p.description,
    liveUrl: p.liveUrl,
    repoUrl: p.repoUrl,
    clientName: p.clientName,
    year: p.year,
    role: p.role,
    featured: p.featured,
    status: p.status,
    coverUrl: p.coverUrl,
    coverPathname: p.coverPathname,
    coverWidth: p.coverWidth,
    coverHeight: p.coverHeight,
    coverBlurData: p.coverBlurData,
    coverAlt: p.coverAlt,
    techIds: p.techs.map((t) => t.techId),
  };
}
