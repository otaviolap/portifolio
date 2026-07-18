"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProject, moveProject } from "@/lib/actions/projects";
import type { ProjectListItemDTO } from "@/lib/queries/projects";

export function ProjectAdminList({ items }: { items: ProjectListItemDTO[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function move(id: string, dir: "up" | "down") {
    startTransition(async () => {
      await moveProject(id, dir);
      router.refresh();
    });
  }

  function remove(id: string, title: string) {
    if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      await deleteProject(id);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-foreground/50">
        Nenhum projeto ainda. Clique em “Novo projeto” para começar.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-foreground/10 rounded-lg border border-foreground/10">
      {items.map((p, i) => (
        <li
          key={p.id}
          className="flex items-center gap-4 px-4 py-3 data-[pending=true]:opacity-50"
          data-pending={pending}
        >
          <div className="flex flex-col">
            <button
              onClick={() => move(p.id, "up")}
              disabled={i === 0 || pending}
              className="text-xs text-foreground/40 hover:text-foreground disabled:opacity-30"
              aria-label="Mover para cima"
            >
              ▲
            </button>
            <button
              onClick={() => move(p.id, "down")}
              disabled={i === items.length - 1 || pending}
              className="text-xs text-foreground/40 hover:text-foreground disabled:opacity-30"
              aria-label="Mover para baixo"
            >
              ▼
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{p.title}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                  p.status === "PUBLISHED"
                    ? "bg-green-500/15 text-green-400"
                    : "bg-foreground/10 text-foreground/50"
                }`}
              >
                {p.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
              </span>
              {p.featured && (
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-400">
                  Destaque
                </span>
              )}
            </div>
            <span className="font-mono text-xs text-foreground/40">/{p.slug}</span>
          </div>

          <Link
            href={`/admin/projetos/${p.id}`}
            className="text-sm text-foreground/70 hover:text-foreground"
          >
            Editar
          </Link>
          <button
            onClick={() => remove(p.id, p.title)}
            disabled={pending}
            className="text-sm text-foreground/50 transition-colors hover:text-red-400 disabled:opacity-50"
          >
            Excluir
          </button>
        </li>
      ))}
    </ul>
  );
}
