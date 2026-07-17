# 04 — Renderização: SEO e GSAP convivendo

A tensão central do projeto: animação quer JS no client, SEO quer HTML no servidor.

**A regra: Server Component busca e renderiza o conteúdo; Client Component só anima nós que o servidor já emitiu.**

## Fluxo da home

```
app/(site)/page.tsx                        [Server]
  └─ getHomeSections()                     [server-only, Prisma]
  └─ getFeaturedProjects()                 [server-only, Prisma]
  └─ <SectionRenderer sections={...} />    [Server, switch(kind)]
       ├─ <HeroSection data={...} />       [Server — emite <h1> real]
       │     └─ <SplitTextReveal text={data.headline} />   [Client — anima]
       ├─ <AssemblySection data={...} />   [Server]
       │     └─ <ScrubAssembly pieces={...} />             [Client]
       └─ <ProjectsTeaser projects={...} /> [Server — emite <a href> reais]
             └─ <RevealGrid>{children}</RevealGrid>        [Client, via children]
```

## O padrão que faz funcionar: client wrapper, Server como `children`

Um Client Component pode receber Server Components via `children` — eles são renderizados no servidor e passados como RSC payload já pronto:

```tsx
// Server Component
<RevealOnScroll>              {/* "use client" — só anima o wrapper */}
  <ProjectCard project={p} /> {/* continua Server — HTML real no source */}
</RevealOnScroll>
```

`ProjectCard` **não vira client** — o HTML dele está no response inicial. Crawler vê tudo; GSAP anima o wrapper.

## Consequências práticas

- `page.tsx`, `layout.tsx`, `sections/*` e `queries/*` → **nunca** levam `"use client"`.
- Props que cruzam para client são **serializáveis** (o objeto `data` do JSONB já validado pelo Zod, strings, números). Nada de instância de Prisma ou `Date` sem `toISOString()` — padronizar em string evita hydration mismatch de timezone.
- **Anti-padrão proibido:** esconder tudo com `opacity: 0` no CSS e revelar via GSAP. Se o JS falhar, a página fica em branco e o LCP é destruído. Use `gsap.from()` — o estado no HTML é o **final**; o estado inicial é setado dentro do `useGSAP` (que só roda após hydration). O flash de 1 frame se resolve com `data-[ready=true]` só no hero, ou se aceita.
- **O hero não anima na entrada por scroll** — anima por timeline no mount. Nada de `opacity: 0` inicial no elemento LCP.

## Cache e revalidação

- `/` e `/projetos/[slug]`: estáticos com `generateStaticParams()` + revalidação por tag.
- `lib/queries/*` usa `unstable_cache` / `cacheTag` com tags `home-sections`, `projects`, `project:${slug}`.
- Server Actions do admin chamam `revalidateTag('projects')` / `revalidateTag('home-sections')` após cada write → **o admin edita e o site público reflete sem rebuild.**
- `/admin/*` e `/api/leads`: `dynamic = 'force-dynamic'`, `noindex` via metadata.

Isso também é a mitigação principal do cold start da Neon (ver [`08-riscos-gotchas.md`](08-riscos-gotchas.md)): o visitante não toca o banco, só o admin toca.
