"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { deleteBlob } from "@/lib/blob";
import { projectFormSchema, type ProjectFormData } from "@/schemas/project";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function toPrismaData(d: ProjectFormData) {
  return {
    title: d.title,
    slug: d.slug,
    summary: d.summary,
    description: d.description ?? null,
    liveUrl: d.liveUrl ?? null,
    repoUrl: d.repoUrl ?? null,
    clientName: d.clientName ?? null,
    year: d.year ?? null,
    role: d.role ?? null,
    featured: d.featured,
    status: d.status,
    coverUrl: d.coverUrl ?? null,
    coverPathname: d.coverPathname ?? null,
    coverWidth: d.coverWidth ?? null,
    coverHeight: d.coverHeight ?? null,
    coverBlurData: d.coverBlurData ?? null,
    coverAlt: d.coverAlt ?? null,
  };
}

async function setTechs(projectId: string, techIds: string[]) {
  await prisma.projectTech.deleteMany({ where: { projectId } });
  if (techIds.length) {
    await prisma.projectTech.createMany({
      data: techIds.map((techId, i) => ({
        projectId,
        techId,
        order: i + 1,
        primary: i === 0,
      })),
      skipDuplicates: true,
    });
  }
}

export async function createProject(raw: unknown): Promise<ActionResult> {
  await requireUser();
  const parsed = projectFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const d = parsed.data;

  if (await prisma.project.findUnique({ where: { slug: d.slug } })) {
    return { ok: false, error: "Já existe um projeto com esse slug." };
  }

  const agg = await prisma.project.aggregate({ _max: { order: true } });
  const project = await prisma.project.create({
    data: {
      ...toPrismaData(d),
      order: (agg._max.order ?? 0) + 1,
      publishedAt: d.status === "PUBLISHED" ? new Date() : null,
    },
  });
  await setTechs(project.id, d.techIds);

  revalidateTag("projects");
  redirect("/admin/projetos");
}

export async function updateProject(
  id: string,
  raw: unknown,
): Promise<ActionResult> {
  await requireUser();
  const parsed = projectFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Dados inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const d = parsed.data;

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Projeto não encontrado." };

  const slugConflict = await prisma.project.findFirst({
    where: { slug: d.slug, NOT: { id } },
    select: { id: true },
  });
  if (slugConflict) return { ok: false, error: "Slug já está em uso." };

  const publishedAt =
    d.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : null;

  await prisma.project.update({
    where: { id },
    data: { ...toPrismaData(d), publishedAt },
  });
  await setTechs(id, d.techIds);

  // cover trocada → apaga a antiga do Blob (evita órfãos)
  if (existing.coverPathname && existing.coverPathname !== d.coverPathname) {
    await deleteBlob(existing.coverPathname);
  }

  revalidateTag("projects");
  redirect("/admin/projetos");
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireUser();
  const p = await prisma.project.findUnique({
    where: { id },
    select: { coverPathname: true },
  });
  await prisma.project.delete({ where: { id } }); // cascade: techs + gallery
  if (p?.coverPathname) await deleteBlob(p.coverPathname);

  revalidateTag("projects");
  revalidatePath("/admin/projetos");
  return { ok: true };
}

export async function moveProject(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  await requireUser();
  const items = await prisma.project.findMany({
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return { ok: false, error: "Projeto não encontrado." };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) return { ok: true }; // borda: no-op

  const a = items[idx];
  const b = items[swapIdx];
  await prisma.$transaction([
    prisma.project.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.project.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);

  revalidateTag("projects");
  revalidatePath("/admin/projetos");
  return { ok: true };
}
