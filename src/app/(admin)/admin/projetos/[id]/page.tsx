import { notFound } from "next/navigation";
import { getProjectByIdAdmin } from "@/lib/queries/projects";
import { getAllTechs } from "@/lib/queries/techs";
import { ProjectForm } from "@/components/admin/ProjectForm";

export default async function EditarProjetoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, techs] = await Promise.all([
    getProjectByIdAdmin(id),
    getAllTechs(),
  ]);
  if (!project) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Editar: {project.title}
      </h1>
      <ProjectForm techs={techs} project={project} />
    </div>
  );
}
