# 02 — Estrutura de pastas

Base gerada pelo `create-next-app` na Fase 0; esta é a organização alvo.

```
portfolio-site/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                     # admin + techs + home sections default
│   └── migrations/
├── public/
│   └── fonts/                      # self-host: next/font/local (evita FOUT no hero)
├── src/
│   ├── middleware.ts               # SÓ auth de /admin — Edge, jose, sem Prisma
│   │
│   ├── app/
│   │   ├── layout.tsx              # <html>, fonts, metadata base — Server
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   │
│   │   ├── (site)/                 # route group público
│   │   │   ├── layout.tsx          # Server: header/footer + <SmoothScrollProvider>
│   │   │   ├── page.tsx            # Server: home, busca HomeSection[] + projetos
│   │   │   ├── template.tsx        # transição de página (remonta a cada nav)
│   │   │   ├── projetos/
│   │   │   │   ├── page.tsx        # Server: grid
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx    # Server: detalhe + generateMetadata + generateStaticParams
│   │   │   │       └── opengraph-image.tsx
│   │   │   └── contato/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (admin)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # FORA do middleware matcher
│   │   │   └── admin/
│   │   │       ├── layout.tsx      # Server: requireUser() + sidebar. SEM Lenis, SEM GSAP.
│   │   │       ├── page.tsx        # dashboard
│   │   │       ├── projetos/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── novo/page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── home/
│   │   │       │   ├── page.tsx           # lista ordenável de seções
│   │   │       │   └── [key]/page.tsx     # editor por kind
│   │   │       ├── techs/page.tsx
│   │   │       └── leads/
│   │   │           ├── page.tsx
│   │   │           └── [id]/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts    # runtime = 'nodejs' (bcrypt)
│   │   │   │   └── logout/route.ts
│   │   │   ├── leads/route.ts        # POST público + rate limit + honeypot
│   │   │   └── upload/route.ts       # handleUpload do Vercel Blob
│   │   │
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   │
│   ├── components/
│   │   ├── ui/                     # Button, Input, Field — burros, sem animação
│   │   ├── site/                   # Header, Footer, ProjectCard, TechPill
│   │   ├── sections/               # 1 arquivo por SectionKind — SERVER components
│   │   │   ├── index.tsx           # SectionRenderer: switch(kind)
│   │   │   ├── HeroSection.tsx
│   │   │   ├── AssemblySection.tsx
│   │   │   ├── FrameSequenceSection.tsx
│   │   │   ├── ManifestoSection.tsx
│   │   │   └── ...
│   │   ├── motion/                 # TUDO aqui é "use client"
│   │   │   ├── SmoothScrollProvider.tsx   # Lenis + ScrollTrigger wiring
│   │   │   ├── PageTransition.tsx
│   │   │   ├── SplitTextReveal.tsx
│   │   │   ├── RevealOnScroll.tsx
│   │   │   ├── ScrubAssembly.tsx
│   │   │   ├── FrameSequenceCanvas.tsx
│   │   │   ├── ColorScrubImage.tsx
│   │   │   ├── MagneticButton.tsx
│   │   │   └── Marquee.tsx
│   │   └── admin/
│   │       ├── ProjectForm.tsx
│   │       ├── BlobImageUploader.tsx
│   │       ├── SectionEditor/       # um sub-editor por kind
│   │       └── SortableList.tsx
│   │
│   ├── lib/
│   │   ├── gsap.ts                 # registerPlugin UMA vez, reexporta
│   │   ├── prisma.ts               # singleton via globalThis
│   │   ├── auth/
│   │   │   ├── session.ts          # sign/verify JWT (jose) — Edge-safe
│   │   │   ├── password.ts         # bcrypt — Node only, "server-only"
│   │   │   └── guard.ts            # requireUser() p/ Server Actions
│   │   ├── blob.ts                 # helpers + validação de imagem
│   │   ├── rate-limit.ts
│   │   ├── queries/                # "server-only" — data access layer (DTOs planos)
│   │   │   ├── projects.ts
│   │   │   ├── home.ts
│   │   │   └── leads.ts
│   │   ├── actions/                # "use server"
│   │   │   ├── projects.ts
│   │   │   ├── home.ts
│   │   │   └── leads.ts
│   │   └── utils.ts                # cn, slugify
│   │
│   ├── schemas/                    # Zod — compartilhado client/server
│   │   ├── project.ts
│   │   ├── home-section.ts         # discriminated union por kind
│   │   ├── lead.ts
│   │   └── auth.ts
│   │
│   ├── hooks/
│   │   ├── useIsomorphicLayoutEffect.ts
│   │   └── usePrefersReducedMotion.ts
│   │
│   └── types/
│       └── index.ts
├── next.config.ts
└── package.json
```

## Regras estruturais (as que sustentam o resto)

- **`components/sections/*` são Server Components.** Recebem `data` já validado e delegam o movimento a um filho de `components/motion/*` via `children`/props serializáveis. É onde a fronteira RSC/client é desenhada.
- **`lib/queries/*` e `lib/auth/password.ts` começam com `import 'server-only'`** — barreira de compilação contra vazar Prisma/bcrypt pro bundle do client.
- **`schemas/*` NÃO importa `server-only`** — usados no `react-hook-form` do admin (client).
- **O route group `(admin)` não importa GSAP nem Lenis.** A separação em route group garante isso estruturalmente; confirme com `@next/bundle-analyzer` que o chunk do admin está limpo.
- **`lib/gsap.ts` faz `registerPlugin` uma vez e reexporta.** Todos os componentes de motion importam dele. Nunca `import gsap/all`.
- **O DAL (`lib/queries/*`) retorna DTOs planos**, não entidades cruas do Prisma — `Date`/`Decimal` cruzando pra client component quebram serialização.
