import type { Metadata } from "next";
import Image from "next/image";
import { getPublishedProjects } from "@/lib/queries/projects";

export const metadata: Metadata = {
  title: "Projetos",
  description: "Projetos desenvolvidos — screenshots e links no ar.",
};

// Estática + revalidada por tag: as Server Actions do admin chamam
// revalidateTag('projects') após cada write → reflete sem redeploy.
export default async function ProjetosPage() {
  const projects = await getPublishedProjects();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-24">
      <header className="mb-12">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Projetos
        </h1>
      </header>

      {projects.length === 0 ? (
        <p className="text-foreground/60">
          Nenhum projeto publicado ainda.
        </p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="group overflow-hidden rounded-2xl border border-foreground/10 transition-colors hover:border-foreground/25"
            >
              {p.coverUrl && p.coverWidth && p.coverHeight && (
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={p.coverUrl}
                    alt={p.coverAlt ?? p.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    placeholder={p.coverBlurData ? "blur" : "empty"}
                    blurDataURL={p.coverBlurData ?? undefined}
                  />
                </div>
              )}
              <div className="p-6">
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
