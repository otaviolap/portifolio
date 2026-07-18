// Edge. SÓ gatekeeping de rota (UX). Não toca banco, não faz bcrypt.
// A proteção real é requireUser() (lib/auth/guard.ts). Ver docs/05-auth.md §5.3.
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get("session")?.value);
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete("session"); // limpa token expirado/inválido
    return res;
  }
  return NextResponse.next();
}

// /login e /api/auth/* ficam FORA do matcher (senão, loop de redirect).
export const config = { matcher: ["/admin/:path*"] };
