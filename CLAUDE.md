# CLAUDE.md

Contexto para o Claude Code. Leia isto antes de qualquer coisa neste repositório.

## O que é este projeto

Site de portfólio da empresa do Otávio (dev brasileiro, React/TypeScript). Objetivo: um site **não-comum**, nível Awwwards/Apple, onde o scroll dirige a experiência — imagem que se monta peça por peça, sequência de frames estilo Apple, elementos que mudam de cor conforme o progresso do scroll. Lista os projetos que ele desenvolveu (screenshot + link pro site no ar) e tem um **CMS próprio**: editável pela URL `/admin` com login, no espírito do Atena da Codie, mas 100% dele.

## Estado atual

**Só documentação — nenhum código foi escrito ainda.** Este repo foi montado como plano completo para retomar a implementação depois, possivelmente em outro computador. A implementação começa pela **Fase 0** em [`docs/07-fases.md`](docs/07-fases.md), que roda `create-next-app` e traz a estrutura real do Next por cima desta documentação.

Quando o usuário disser "vamos começar" / "começa a fase 0" / similar, siga a fase 0 do doc de fases. Não invente estrutura antes disso — o `create-next-app` define a base.

## Stack (decidida com o usuário — NÃO questione nem proponha alternativas)

- **Next.js 15**, App Router, React 19, TypeScript — full-stack, um único repo/deploy. Route Handlers + Server Actions = o "back". Sem servidor Node separado.
- **Neon** (Postgres serverless) + **Prisma 6**.
- **Vercel Blob** para imagens, via **client upload** (não server upload).
- **Auth própria**: usuário único, `bcryptjs` + cookie httpOnly. Sessão = **JWT HS256 com `jose`**. Sem NextAuth.
- **GSAP + ScrollTrigger + `@gsap/react` (useGSAP) + Lenis** para animação.
- **Tailwind CSS**.
- **Zod** para validação, **react-hook-form** nos forms do admin.
- Deploy: **Vercel**.

## As 5 decisões que amarram todo o resto (não as reverta sem avisar)

1. **bcrypt NÃO roda no middleware** (Edge runtime não tem APIs de Node). Por isso a sessão é um JWT assinado com `jose` (Web Crypto, Edge-safe); o middleware só verifica assinatura, e o bcrypt fica confinado ao `POST /api/auth/login` com `runtime = 'nodejs'`. Ver [`docs/05-auth.md`](docs/05-auth.md).

2. **Middleware é UX, não segurança.** O Next já teve CVE de bypass de middleware (CVE-2025-29927) e Route Handlers são alcançáveis direto. A proteção real é `requireUser()` (`lib/auth/guard.ts`, `server-only`), chamado na primeira linha do layout do admin E de cada Server Action. Ele revalida `tokenVersion` no banco → dá logout global.

3. **SEO e animação convivem por uma regra:** Server Component busca e renderiza o conteúdo; Client Component só anima nós que o servidor já emitiu. Padrão: client component como wrapper, Server Component como `children`. NUNCA esconder conteúdo com `opacity:0` no CSS e revelar por JS (mata LCP e quebra sem JS). Ver [`docs/04-renderizacao-seo.md`](docs/04-renderizacao-seo.md).

4. **Upload é client-side** (`@vercel/blob/client`). Route Handler na Vercel corta body em 4.5MB e screenshot PNG passa disso. A validação que importa está no `onBeforeGenerateToken` de `/api/upload` (auth + tipos + tamanho). Ver [`docs/06-upload-imagem.md`](docs/06-upload-imagem.md).

5. **Páginas públicas são estáticas** (ISR com `revalidateTag`). Isso é o que neutraliza o cold start da Neon: o visitante não toca o banco, só o admin toca. As Server Actions do admin chamam `revalidateTag` após cada write → edita no admin, site reflete sem redeploy.

## Regras estruturais (quando o código existir)

- `components/sections/*` = **Server Components** que recebem `data` já validado por Zod e delegam movimento a um filho de `components/motion/*`.
- `components/motion/*` = **tudo `"use client"`**. Todo componente de motion usa `useGSAP` do `@gsap/react` (nunca `useEffect` cru — duplica triggers no Strict Mode) e `gsap.matchMedia` para `prefers-reduced-motion` + tuning mobile.
- `lib/queries/*` e `lib/auth/password.ts` começam com `import 'server-only'` (barreira contra vazar Prisma/bcrypt pro client).
- `schemas/*` NÃO importa `server-only` (o admin usa no client).
- O route group `(admin)` **não importa GSAP nem Lenis** — separação estrutural, confirmável com bundle-analyzer.
- `lib/gsap.ts` faz `registerPlugin` uma única vez e reexporta. Nunca `import gsap/all`.
- DAL retorna **DTOs planos**, nunca entidade crua do Prisma (`Date`/`Decimal` quebram serialização RSC→client).

## Como trabalhar aqui

- Siga as fases em ordem ([`docs/07-fases.md`](docs/07-fases.md)); cada fase entrega algo verificável no browser. A ordem existe pra matar risco cedo (Neon+Prisma validado na Fase 1, wiring Lenis+ScrollTrigger na Fase 4).
- Antes de codar um efeito de animação, releia [`docs/03-animacao.md`](docs/03-animacao.md) — os gotchas de Lenis+ScrollTrigger (RAF único, sem `scrollerProxy`, refresh no route change) são a diferença entre funcionar e passar um dia debugando jitter.
- Antes de mexer em qualquer coisa de auth/upload, releia o doc correspondente — as camadas de segurança são deliberadas.
- Assets pesados (peças fatiadas, frames da sequência): usar **placeholder funcional**; o Otávio troca pelos reais depois via admin.
- Idioma: pt-BR nas explicações e comentários quando fizer sentido; identificadores e termos técnicos no original.

## Referência rápida de arquivos críticos (a criar)

- `prisma/schema.prisma` — define todo o resto ([`docs/01-schema-prisma.md`](docs/01-schema-prisma.md))
- `src/components/motion/SmoothScrollProvider.tsx` — wiring Lenis+GSAP; se errado, toda animação quebra
- `src/lib/auth/session.ts` — JWT Edge-safe; o que torna o middleware possível sem bcrypt
- `src/schemas/home-section.ts` — Zod discriminado por `kind` que dá type-safety ao JSONB da home
- `src/app/api/upload/route.ts` — `handleUpload` + auth no `onBeforeGenerateToken`
