# 05 — Auth

Usuário único (o Otávio). Sem NextAuth. bcrypt + cookie JWT.

**Decisão que amarra tudo:** bcrypt **não roda em middleware** (Edge runtime, sem APIs nativas de Node). Por isso o cookie de sessão é um **JWT HS256 assinado com `jose`** — o middleware só verifica assinatura (Web Crypto), e o bcrypt fica confinado ao Route Handler de login (`runtime = 'nodejs'`). Isso também evita hit no banco a cada request.

## 5.1 Fluxo de login

```
POST /api/auth/login  (runtime: 'nodejs')
  1. zod parse { email, password }
  2. rate limit por ipHash (5 tentativas / 15 min) → 429
  3. user = prisma.user.findUnique({ email })
  4. ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
     └─ compara contra hash dummy mesmo se user não existe → timing constante,
        não vaza "esse email existe"
  5. se !user || !ok → 401 genérico ("Credenciais inválidas")
  6. token = await signSession({ sub: user.id, email, tv: user.tokenVersion })
  7. cookies().set('session', token, { httpOnly, secure, sameSite:'lax',
                                        path:'/', maxAge: 60*60*8 })
  8. prisma.user.update({ lastLoginAt })
  9. 200 { ok: true } → client faz router.push('/admin') + router.refresh()
```

## 5.2 Formato do cookie

Cookie `session`, valor = **JWT compacto HS256** assinado com `AUTH_SECRET` via `jose`:

```ts
// src/lib/auth/session.ts — Edge-safe, ZERO import de Node/Prisma
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
const ALG = "HS256";
export type SessionPayload = { sub: string; email: string; tv: number };

export async function signSession(p: SessionPayload) {
  return new SignJWT({ email: p.email, tv: p.tv })
    .setProtectedHeader({ alg: ALG })
    .setSubject(p.sub)
    .setIssuedAt()
    .setIssuer("portfolio")
    .setAudience("admin")
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [ALG], issuer: "portfolio", audience: "admin",
    });
    return { sub: payload.sub!, email: payload.email as string, tv: payload.tv as number };
  } catch { return null; }
}
```

Atributos: `httpOnly` (JS não lê → XSS não rouba), `secure` em prod, `sameSite: 'lax'` (protege CSRF em POST cross-site mantendo o link de login), `path: '/'`, `maxAge` 8h. `algorithms: [ALG]` explícito no verify barra o ataque `alg: none`/confusão de algoritmo.

## 5.3 Middleware

`src/middleware.ts` — Edge. **Só faz gatekeeping de rota.** Não toca banco, não faz bcrypt.

```ts
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

export const config = { matcher: ["/admin/:path*"] };
```

`/login` fica **fora** do matcher (senão, loop de redirect). O `/api/auth/login` também.

## 5.4 A segunda camada (a que realmente protege)

Middleware é **UX, não segurança** — o Next já teve CVE de bypass de middleware (CVE-2025-29927), e um Route Handler é alcançável diretamente. Portanto **toda** mutação revalida:

```ts
// src/lib/auth/guard.ts — "server-only"
import "server-only";
export async function requireUser() {
  const session = await verifySession((await cookies()).get("session")?.value);
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, tokenVersion: true },
  });
  if (!user || user.tokenVersion !== session.tv) redirect("/login");
  return user;
}
```

`requireUser()` é a **primeira linha** de `(admin)/admin/layout.tsx` e de **cada Server Action** em `lib/actions/*`. A checagem de `tokenVersion` é o que dá logout global (custo: 1 query rápida por request autenticado — aceitável no admin).

Logout: `POST /api/auth/logout` → `cookies().delete('session')`. "Sair de todos os dispositivos" → `tokenVersion: { increment: 1 }`.

## 5.5 Seed do admin

`prisma/seed.ts`, idempotente:

```ts
const email = required("ADMIN_EMAIL");
const password = required("ADMIN_PASSWORD");
await prisma.user.upsert({
  where: { email },
  update: {},                                   // NÃO sobrescreve senha em re-seed
  create: { email, name: "Otávio", passwordHash: await bcrypt.hash(password, 12) },
});
// + techs base (nextjs, typescript, react, postgres, prisma, tailwind, vercel, gsap...)
// + HomeSection default para cada kind, com data placeholder válido no Zod
```

`package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`. Rodar via `dotenv -e .env.local -- npx prisma db seed`. **Nunca** commitar `ADMIN_PASSWORD`; em produção, rodar o seed uma vez localmente apontando para a Neon de prod, ou expor um `/api/setup` protegido por `SETUP_TOKEN` que se auto-desativa se já existir usuário.

Custo bcrypt = 12 rounds (~250ms) — proposital, e só no login.
