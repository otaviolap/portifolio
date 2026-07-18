import type { Metadata } from "next";
import { getPublishedProjects } from "@/lib/queries/projects";

export const metadata: Metadata = {
  title: "Projetos",
  description: "Projetos desenvolvidos — screenshots e links no ar.",
};

// Fase 1: dinâmica de propósito (query direta ao banco) para PROVAR a conexão
// Neon+Prisma em produção. Vira estática (ISR + revalidateTag) na Fase 5.
// NOTA: esta página mudará para o route group (site) quando o SmoothScrollProvider
// entrar na Fase 4.
export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const projects = await getPublishedProjects();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-24">
      <header className="mb-12">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
          Fase 1 — dados vindos da Neon
        </span>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Projetos
        </h1>
      </header>

      {projects.length === 0 ? (
        <p className="text-foreground/60">
          Nenhum projeto publicado ainda. Rode o seed (<code>npm run db:seed</code>){" "}
          ou publique um projeto pelo admin.
        </p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="group rounded-2xl border border-foreground/10 p-6 transition-colors hover:border-foreground/25"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-xl font-medium">{p.title}</h2>
                {p.year && (
                  <span className="font-mono text-xs text-foreground/40">
                    {p.year}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-foreground/60">{p.summary}</p>
              {p.liveUrl && (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-medium text-foreground/80 underline underline-offset-4 hover:text-foreground"
                >
                  Ver no ar ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
