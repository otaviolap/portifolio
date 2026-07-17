# 01 — Schema Prisma

Arquivo alvo: `prisma/schema.prisma`.

`datasource` com duas URLs: `url` = Neon **pooled** (`-pooler`, `pgbouncer=true`), `directUrl` = Neon **direta** (usada só por migrate/introspect).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Neon POOLED (-pooler, pgbouncer=true)
  directUrl = env("DIRECT_URL")     // Neon DIRECT — migrate/introspect
}

// ---------------------------------------------------------------- AUTH

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String                          // bcrypt, 60 chars, 12 rounds
  name         String?
  tokenVersion Int       @default(0)           // bump = invalida todas as sessões
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  @@map("users")
}
```

**Sem tabela `Session`.** Sessão é stateless (JWT). Logout global = `tokenVersion++`. O middleware não consulta banco (Prisma não roda em Edge sem driver adapter, e queremos zero latência em `/admin/*`); `tokenVersion` é revalidado nas Server Actions/guards que rodam em Node.

```prisma
// ---------------------------------------------------------------- PROJETOS

enum ProjectStatus { DRAFT PUBLISHED }

model Project {
  id      String  @id @default(cuid())
  slug    String  @unique @db.VarChar(120)
  title   String  @db.VarChar(160)
  summary String  @db.VarChar(280)             // card do grid + og:description
  description String? @db.Text

  // Cover / screenshot principal
  coverUrl      String? @db.Text               // URL do Vercel Blob
  coverPathname String? @db.Text               // necessário pro del() — não parsear URL
  coverWidth    Int?
  coverHeight   Int?
  coverBlurData String? @db.Text               // blurDataURL (next/image), calculado 1x no upload
  coverAlt      String? @db.VarChar(200)

  liveUrl    String? @db.Text
  repoUrl    String? @db.Text
  clientName String? @db.VarChar(120)
  year       Int?    @db.SmallInt
  role       String? @db.VarChar(160)          // "Full-stack", "Front-end + Design"

  order       Int           @default(0)
  featured    Boolean       @default(false)
  status      ProjectStatus @default(DRAFT)
  publishedAt DateTime?

  content Json? @db.JsonB                       // blocos ricos da página de detalhe

  seoTitle       String? @db.VarChar(70)
  seoDescription String? @db.VarChar(160)

  techs   ProjectTech[]
  gallery ProjectImage[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status, order])
  @@index([status, featured, order])
  @@map("projects")
}
```

**Justificativas de tipo:**
- `slug @unique @db.VarChar(120)` — chave de rota; `VarChar` limitado (não `Text`) pra o índice único não degradar e o limite valer no DB, não só no Zod.
- `coverPathname` separado de `coverUrl` — o Blob deleta por URL, mas guardar o `pathname` deixa explícito o que é "nosso" no store e permite `list({ prefix })` de manutenção. Sem isso você vira refém de parsear URL.
- `coverWidth/Height/BlurData` persistidos — `next/image` com `fill` + `placeholder="blur"` exige `blurDataURL` pra imagem remota; ter dimensões evita CLS. Calculado **uma vez** no upload, não a cada render. **Também é o que impede o ScrollTrigger de medir errado** (imagem sem dimensão carrega depois da medição).
- `Int @db.SmallInt` em `year` — 2 bytes e sinaliza domínio.
- `content Json @db.JsonB` — página de detalhe editável, formato varia por projeto. Ver "regra JSONB" abaixo.
- `order Int` + índice `[status, order]` — a query da home é sempre `WHERE status='PUBLISHED' ORDER BY order` → index-only scan.

```prisma
// ---------------------------------------------------------------- TECNOLOGIAS

enum TechCategory { LANGUAGE FRAMEWORK DATABASE INFRA DESIGN TOOL }

model Tech {
  id       String       @id @default(cuid())
  slug     String       @unique @db.VarChar(60)   // "nextjs", "postgres"
  name     String       @db.VarChar(60)           // "Next.js"
  category TechCategory @default(TOOL)
  color    String?      @db.VarChar(9)            // "#0070F3"
  iconSlug String?      @db.VarChar(60)           // referência a simple-icons
  order    Int          @default(0)
  projects ProjectTech[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([category, order])
  @@map("techs")
}

model ProjectTech {
  projectId String
  techId    String
  order     Int     @default(0)                   // ordem de exibição dentro do projeto
  primary   Boolean @default(false)              // destacar a stack principal
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tech    Tech    @relation(fields: [techId], references: [id], onDelete: Cascade)
  @@id([projectId, techId])
  @@index([techId])
  @@map("project_techs")
}
```

**Join table explícita, não m2m implícito:** o m2m implícito do Prisma (`techs Tech[]` dos dois lados) cria `_ProjectToTech` sem colunas extras. Precisamos de `order` (ordem das tags no card é decisão editorial) e `primary`. Custo: writes viram `set`/`createMany` em vez de `connect` — aceitável e explícito.

```prisma
// ---------------------------------------------------------------- GALERIA

model ProjectImage {
  id        String  @id @default(cuid())
  projectId String
  url       String  @db.Text
  pathname  String  @db.Text
  alt       String? @db.VarChar(200)
  width     Int?
  height    Int?
  blurData  String? @db.Text
  caption   String? @db.VarChar(280)
  order     Int     @default(0)
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@index([projectId, order])
  @@map("project_images")
}

// ---------------------------------------------------------------- HOME (CMS)

enum SectionKind {
  HERO MANIFESTO ASSEMBLY FRAME_SEQUENCE PROJECTS_TEASER
  SERVICES PROCESS STATS TESTIMONIALS CTA CONTACT
}

model HomeSection {
  id      String      @id @default(cuid())
  key     String      @unique @db.VarChar(60)  // "hero", "manifesto-01"
  kind    SectionKind
  label   String      @db.VarChar(80)          // nome no admin
  order   Int         @default(0)
  enabled Boolean     @default(true)
  data    Json        @db.JsonB                // payload validado por Zod, discriminado por `kind`
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  @@index([enabled, order])
  @@map("home_sections")
}

// ---------------------------------------------------------------- LEADS

enum LeadStatus { NEW READ REPLIED ARCHIVED SPAM }

model Lead {
  id      String  @id @default(cuid())
  name    String  @db.VarChar(120)
  email   String  @db.VarChar(180)
  company String? @db.VarChar(120)
  phone   String? @db.VarChar(40)
  budget  String? @db.VarChar(40)
  message String  @db.Text
  status  LeadStatus @default(NEW)
  notes   String?    @db.Text                  // anotação interna do Otávio

  // contexto de captação — analytics leve sem ferramenta externa
  sourcePath String? @db.Text
  referrer   String? @db.Text
  utm        Json?   @db.JsonB                 // { source, medium, campaign, term, content }
  userAgent  String? @db.Text
  ipHash     String? @db.VarChar(64)           // SHA-256(ip + salt) — nunca o IP cru (LGPD)

  createdAt DateTime  @default(now())
  readAt    DateTime?
  @@index([status, createdAt(sort: Desc)])
  @@index([email])
  @@map("leads")
}
```

**Justificativas dos leads:**
- `ipHash` (não `ip`) — rate-limit e dedupe funcionam com hash; IP cru é dado pessoal LGPD sem necessidade. `VarChar(64)` = hex de SHA-256.
- `@@index([status, createdAt(sort: Desc)])` — a inbox do admin é `WHERE status != 'ARCHIVED' ORDER BY createdAt DESC`; índice ordenado evita sort em memória.
- Sem FK para `User` — usuário único, não há atribuição.

---

## A regra: JSONB vs colunas

**O que a query toca vira coluna; o resto vira JSONB.**

Cada `SectionKind` tem payload radicalmente diferente:
- `HERO`: `{ eyebrow, headline[], sublines[], ctaLabel, ctaHref }`
- `ASSEMBLY`: `{ pieces: [{ blobUrl, fromX, fromY, fromRotate, delay }], targetColorFrom, targetColorTo, pinDuration }`
- `FRAME_SEQUENCE`: `{ baseUrl, frameCount, ext, width, height, pinVh }`
- `STATS`: `{ items: [{ value, suffix, label }] }`

Modelar isso com colunas gera ~40 colunas 95% nulas, ou uma EAV (`SectionField`) pior de ler/escrever. JSONB + **discriminated union em Zod** (`z.discriminatedUnion('kind', [...])`) dá:
- validação forte no boundary (o banco aceita qualquer JSON, mas nada entra sem passar pelo Zod parse);
- tipo inferido (`z.infer`) usado direto no Server Component;
- evolução de schema sem migration (novo campo = mudar o Zod + default no parse).

Trade-off aceito: sem constraint no DB, sem query por campo interno do JSON. Não precisamos de nenhum dos dois — a home lê **todas** as seções de uma vez. `kind`, `order` e `enabled` são colunas reais **porque são os únicos campos que a query filtra/ordena**. Mesmo princípio em `Project.content` e `Lead.utm`.
