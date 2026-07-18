import { getAllTechs } from "@/lib/queries/techs";
import { ProjectForm } from "@/components/admin/ProjectForm";

export default async function NovoProjetoPage() {
  const techs = await getAllTechs();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Novo projeto
      </h1>
      <ProjectForm techs={techs} />
    </div>
  );
}
