import Link from "next/link";
import { getAllProjectsAdmin } from "@/lib/queries/projects";
import { ProjectAdminList } from "@/components/admin/ProjectAdminList";

export default async function AdminProjetosPage() {
  const projects = await getAllProjectsAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
        <Link
          href="/admin/projetos/novo"
          className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Novo projeto
        </Link>
      </div>
      <ProjectAdminList items={projects} />
    </div>
  );
}
