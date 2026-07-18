import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "./session";

/**
 * A camada de segurança REAL (middleware é só UX — CVE-2025-29927).
 * Primeira linha do layout de /admin E de toda Server Action.
 * Revalida tokenVersion no banco → permite logout global.
 */
export async function requireUser() {
  const user = await getUserOrNull();
  if (!user) redirect("/login");
  return user;
}

/**
 * Igual ao requireUser, mas retorna null em vez de redirecionar.
 * Para contextos sem redirect (ex.: /api/upload → responde 401).
 */
export async function getUserOrNull() {
  const token = (await cookies()).get("session")?.value;
  const session = await verifySession(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, tokenVersion: true },
  });
  if (!user || user.tokenVersion !== session.tv) return null;

  return user;
}
