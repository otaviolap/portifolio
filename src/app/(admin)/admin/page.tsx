import { requireUser } from "@/lib/auth/guard";

export default async function AdminDashboard() {
  const user = await requireUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Bem-vindo, {user.name ?? user.email}. As seções de conteúdo (projetos,
        home, techs, leads) entram nas próximas fases.
      </p>
    </div>
  );
}
