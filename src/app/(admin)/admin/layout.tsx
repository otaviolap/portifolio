// Server Component. requireUser() é a PRIMEIRA linha — proteção real do /admin.
// SEM Lenis, SEM GSAP (separação estrutural do route group).
import Link from "next/link";
import { requireUser } from "@/lib/auth/guard";
import { LogoutButton } from "@/components/admin/LogoutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/projetos", label: "Projetos" },
  { href: "/admin/home", label: "Home" },
  { href: "/admin/techs", label: "Techs" },
  { href: "/admin/leads", label: "Leads" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-foreground/10 p-5">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            Admin
          </span>
          <nav className="mt-6 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-foreground/10 pt-4">
          <span className="truncate text-xs text-foreground/40" title={user.email}>
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
