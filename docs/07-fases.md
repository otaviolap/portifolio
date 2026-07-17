# 07 — Fases de implementação

Ordem escolhida para **matar o risco cedo**: o que mais pode dar errado (Neon+Prisma na Vercel, e Lenis+ScrollTrigger+pin) é validado nas fases 1 e 4, não no fim. Cada fase entrega algo verificável no browser.

---

## Fase 0 — Scaffold + deploy pipeline (~2h)

`create-next-app` (TS, App Router, Tailwind), fonts self-hosted (`next/font/local`), layout base, deploy na Vercel no primeiro commit. Instalar dependências (ver lista no README / `08`).

✅ **Verificável:** URL `.vercel.app` no ar com uma página estática. Pipeline provado antes de qualquer complexidade.

> A partir daqui existe código real por cima desta documentação.

## Fase 1 — Neon + Prisma + primeira query em produção (~3h)

Schema completo (doc 01), `migrate dev`, `db push` na Neon, singleton do Prisma (`lib/prisma.ts`), seed (doc 05). Uma página `/projetos` que lista o que veio do seed.

✅ **Verificável:** `/projetos` **em produção** mostrando dados da Neon. Valida pooled URL, SSL, cold start e o build do Prisma Client na Vercel — os quatro pontos onde esse stack costuma quebrar.

## Fase 2 — Auth completo (~4h)

`session.ts`, `password.ts`, `guard.ts`, `middleware.ts`, `/login`, `/api/auth/{login,logout}`, `(admin)/admin/layout.tsx` com `requireUser()`, rate limit. (Doc 05.)

✅ **Verificável:** `/admin` redireciona pra `/login`; login com o seed entra; logout sai; DevTools mostra o cookie `httpOnly`; deletar o cookie derruba o acesso.

## Fase 3 — Admin CRUD de projetos + upload (~8h) ⭐

`/api/upload` com `handleUpload` (doc 06), `BlobImageUploader`, `ProjectForm` (RHF+Zod), Server Actions de create/update/delete, lista com reorder, gestão de Techs, `revalidateTag`.

✅ **Verificável:** criar projeto pelo admin com screenshot real → aparece em `/projetos` sem redeploy. **A partir daqui o site é alimentável com conteúdo verdadeiro, e todo o resto tem dados de verdade pra animar.**

## Fase 4 — Fundação de animação (~4h) ⭐

`lib/gsap.ts`, `SmoothScrollProvider` (Lenis+ticker+update), `useGSAP` provado, `SplitTextReveal`, `RevealOnScroll`, `template.tsx`, `usePrefersReducedMotion`, uma seção-cobaia com `pin` + `scrub`. (Doc 03.)

✅ **Verificável:** scroll suave no site inteiro, uma seção pinando e um texto revelando. Resize e navegação `/` ↔ `/projetos` não quebram o pin. **Se o wiring do Lenis estiver errado, você descobre aqui — com uma seção, não com oito.**

## Fase 5 — Home dirigida por dados (~6h)

`HomeSection` + Zod discriminado, `SectionRenderer`, seções simples (Hero, Manifesto, Stats, ProjectsTeaser, CTA), admin `/admin/home` com editores por kind.

✅ **Verificável:** editar o headline do hero no `/admin/home` → home pública muda.

## Fase 6 — Os efeitos pesados (~10h)

`ScrubAssembly` (peças + tint scrub), `FrameSequenceCanvas` (preload em ondas), `ColorScrubImage` (SVG inline), pipeline de assets das peças/frames via Blob, `matchMedia` para variantes desktop/mobile. **Placeholder funcional** — Otávio troca pelos assets reais depois.

✅ **Verificável:** imagem se monta ao scrollar, sequência de frames scrubando a 60fps no desktop.

## Fase 7 — Detalhe de projeto + contato (~5h)

`/projetos/[slug]` com `generateStaticParams` + `generateMetadata` + `opengraph-image`, blocos do `content` JSONB, galeria, form de contato → `POST /api/leads` (honeypot + rate limit + `ipHash`), `/admin/leads`.

✅ **Verificável:** enviar lead pelo site → aparece em `/admin/leads`; compartilhar link de projeto no WhatsApp mostra OG image.

## Fase 8 — Performance, a11y e polimento (~6h)

Lighthouse, LCP do hero, `prefers-reduced-motion` auditado em todas as seções, `ScrollTrigger` desligado/simplificado em mobile, `sitemap.ts`/`robots.ts`, JSON-LD, `next/dynamic` nas seções pesadas abaixo da dobra, navegação por teclado no admin. (Doc 08.)

✅ **Verificável:** Lighthouse mobile ≥90 em Performance e ≥95 em Acessibilidade; com "reduzir movimento" ligado no SO, o site é estático e legível.

## Fase 9 — Domínio, analytics, hardening (~2h)

Domínio custom, `@vercel/analytics` + `@vercel/speed-insights`, headers de segurança (CSP, `X-Frame-Options`, `Referrer-Policy`), 404 custom, `error.tsx`.

---

## Os dois pivôs

- **Fase 3** é onde o site vira alimentável — dali em diante tudo anima dados reais, não lorem ipsum.
- **Fase 4** é onde o wiring do Lenis se prova. Errar aqui com uma seção custa minutos; errar com oito custa um dia.

**Estimativa total: ~50h**, sendo 10h só nos efeitos pesados (Fase 6).
