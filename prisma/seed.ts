import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

// ------------------------------------------------------------------ ADMIN
async function seedAdmin() {
  const email = required("ADMIN_EMAIL");
  const password = required("ADMIN_PASSWORD");
  await prisma.user.upsert({
    where: { email },
    update: {}, // NÃO sobrescreve senha em re-seed
    create: {
      email,
      name: "Otávio",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log(`✓ admin: ${email}`);
}

// ------------------------------------------------------------------ TECHS
const TECHS: Array<{
  slug: string;
  name: string;
  category: Prisma.TechCreateInput["category"];
  color?: string;
  iconSlug?: string;
  order: number;
}> = [
  { slug: "nextjs", name: "Next.js", category: "FRAMEWORK", color: "#000000", iconSlug: "nextdotjs", order: 1 },
  { slug: "react", name: "React", category: "FRAMEWORK", color: "#61DAFB", iconSlug: "react", order: 2 },
  { slug: "typescript", name: "TypeScript", category: "LANGUAGE", color: "#3178C6", iconSlug: "typescript", order: 3 },
  { slug: "postgres", name: "PostgreSQL", category: "DATABASE", color: "#4169E1", iconSlug: "postgresql", order: 4 },
  { slug: "prisma", name: "Prisma", category: "DATABASE", color: "#2D3748", iconSlug: "prisma", order: 5 },
  { slug: "tailwind", name: "Tailwind CSS", category: "FRAMEWORK", color: "#06B6D4", iconSlug: "tailwindcss", order: 6 },
  { slug: "gsap", name: "GSAP", category: "TOOL", color: "#0AE448", iconSlug: "greensock", order: 7 },
  { slug: "vercel", name: "Vercel", category: "INFRA", color: "#000000", iconSlug: "vercel", order: 8 },
];

async function seedTechs() {
  for (const t of TECHS) {
    await prisma.tech.upsert({
      where: { slug: t.slug },
      update: { name: t.name, category: t.category, color: t.color, iconSlug: t.iconSlug, order: t.order },
      create: t,
    });
  }
  console.log(`✓ techs: ${TECHS.length}`);
}

// ------------------------------------------------------------------ HOME
// data placeholder por kind — as SHAPES seguem o doc 01; serão validadas
// pelo Zod discriminado (schemas/home-section.ts) na Fase 5.
const HOME_SECTIONS: Array<{
  key: string;
  kind: Prisma.HomeSectionCreateInput["kind"];
  label: string;
  order: number;
  data: Prisma.InputJsonValue;
}> = [
  {
    key: "hero",
    kind: "HERO",
    label: "Hero",
    order: 1,
    data: {
      eyebrow: "Estúdio de desenvolvimento",
      headline: ["Sites que", "se movem", "com você"],
      sublines: ["Experiências web sob medida, do conceito ao deploy."],
      ctaLabel: "Ver projetos",
      ctaHref: "/projetos",
    },
  },
  {
    key: "manifesto-01",
    kind: "MANIFESTO",
    label: "Manifesto",
    order: 2,
    data: {
      text: "Cada scroll é uma decisão de design. Nada aqui é template.",
    },
  },
  {
    key: "stats",
    kind: "STATS",
    label: "Números",
    order: 3,
    data: {
      items: [
        { value: 12, suffix: "+", label: "projetos entregues" },
        { value: 100, suffix: "%", label: "código próprio" },
        { value: 60, suffix: "fps", label: "nas animações" },
      ],
    },
  },
  {
    key: "projects-teaser",
    kind: "PROJECTS_TEASER",
    label: "Prévia de projetos",
    order: 4,
    data: { title: "Trabalho recente", limit: 4 },
  },
  {
    key: "cta",
    kind: "CTA",
    label: "Chamada final",
    order: 5,
    data: {
      headline: "Vamos construir algo memorável?",
      ctaLabel: "Falar comigo",
      ctaHref: "/contato",
    },
  },
];

async function seedHome() {
  for (const s of HOME_SECTIONS) {
    await prisma.homeSection.upsert({
      where: { key: s.key },
      update: { kind: s.kind, label: s.label, order: s.order, data: s.data },
      create: s,
    });
  }
  console.log(`✓ home sections: ${HOME_SECTIONS.length}`);
}

// ------------------------------------------------------------------ PROJETOS (exemplo)
const PROJECTS: Array<{
  slug: string;
  title: string;
  summary: string;
  liveUrl: string;
  year: number;
  order: number;
  featured: boolean;
  role: string;
  techSlugs: string[];
}> = [
  {
    slug: "aurora-commerce",
    title: "Aurora Commerce",
    summary: "E-commerce headless com checkout próprio e catálogo dirigido por scroll.",
    liveUrl: "https://example.com/aurora",
    year: 2025,
    order: 1,
    featured: true,
    role: "Full-stack",
    techSlugs: ["nextjs", "typescript", "postgres", "tailwind"],
  },
  {
    slug: "nebula-agency",
    title: "Nebula Agency",
    summary: "Site institucional de agência com sequência de frames estilo Apple.",
    liveUrl: "https://example.com/nebula",
    year: 2024,
    order: 2,
    featured: false,
    role: "Front-end + Motion",
    techSlugs: ["nextjs", "react", "gsap", "tailwind"],
  },
];

async function seedProjects() {
  for (const p of PROJECTS) {
    const project = await prisma.project.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        summary: p.summary,
        liveUrl: p.liveUrl,
        year: p.year,
        order: p.order,
        featured: p.featured,
        role: p.role,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        liveUrl: p.liveUrl,
        year: p.year,
        order: p.order,
        featured: p.featured,
        role: p.role,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    // techs do projeto (join explícita) — recria do zero para ser idempotente
    await prisma.projectTech.deleteMany({ where: { projectId: project.id } });
    const techs = await prisma.tech.findMany({
      where: { slug: { in: p.techSlugs } },
      select: { id: true, slug: true },
    });
    const bySlug = new Map(techs.map((t) => [t.slug, t.id]));
    await prisma.projectTech.createMany({
      data: p.techSlugs
        .map((slug, i) => {
          const techId = bySlug.get(slug);
          return techId
            ? { projectId: project.id, techId, order: i + 1, primary: i === 0 }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
      skipDuplicates: true,
    });
  }
  console.log(`✓ projetos: ${PROJECTS.length}`);
}

async function main() {
  await seedAdmin();
  await seedTechs();
  await seedHome();
  await seedProjects();
  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
