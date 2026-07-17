# Portfolio Site

Site de portfólio da empresa — nível Awwwards/Apple, com scroll dirigindo a experiência (imagem que se monta peça por peça, sequência de frames, elementos que mudam de cor conforme o progresso). Lista os projetos desenvolvidos (screenshot + link pro site no ar) e é **editável pela própria URL, com login** (um CMS próprio, no espírito do Atena da Codie, mas 100% meu).

> **Status: planejamento completo, código ainda não iniciado.**
> Este repositório contém, por enquanto, só a documentação do que foi decidido. A implementação começa pela Fase 0 em [`docs/07-fases.md`](docs/07-fases.md).

---

## Stack

| Camada | Escolha |
|---|---|
| Front + back | **Next.js 15** (App Router, React 19, TypeScript) — um repo, um deploy. Route Handlers + Server Actions são o "back Node". |
| Banco | **Neon** (Postgres serverless) + **Prisma** |
| Imagens | **Vercel Blob** (client upload) |
| Auth | **Própria** — usuário único, bcrypt + cookie httpOnly (JWT `jose`). Sem NextAuth. |
| Animação | **GSAP + ScrollTrigger + Lenis** |
| Estilização | **Tailwind CSS** |
| Deploy | **Vercel** |

**Por que Next.js e não "React + Node separado":** portfólio precisa ser achado no Google e SPA não renderiza no servidor. Um back Node separado seria um segundo deploy, CORS e auth cross-domain sem ganho — o back aqui cabe inteiro nas Route Handlers.

## O que o admin edita (`/admin`, protegido por login)

- **CRUD de projetos** — título, slug, descrição, screenshot (upload), link do site no ar, repositório, tecnologias, ordem, publicado/rascunho.
- **Textos e seções da home** — headline, sobre, serviços, números, sem tocar em código.
- **Leads** — leitura dos contatos recebidos pelo formulário do site.

---

## Documentação

Leia nesta ordem:

| Doc | Conteúdo |
|---|---|
| [`docs/00-visao-geral.md`](docs/00-visao-geral.md) | Contexto, objetivo, decisões fechadas e o porquê de cada uma |
| [`docs/01-schema-prisma.md`](docs/01-schema-prisma.md) | Modelo de dados completo + a regra JSONB vs colunas |
| [`docs/02-estrutura-pastas.md`](docs/02-estrutura-pastas.md) | Árvore de pastas do App Router e as regras estruturais |
| [`docs/03-animacao.md`](docs/03-animacao.md) | GSAP + Lenis: provider, padrões, os efeitos pesados |
| [`docs/04-renderizacao-seo.md`](docs/04-renderizacao-seo.md) | Como SEO (Server Components) e animação (Client) convivem |
| [`docs/05-auth.md`](docs/05-auth.md) | Login, cookie JWT, middleware, a camada que realmente protege |
| [`docs/06-upload-imagem.md`](docs/06-upload-imagem.md) | Vercel Blob client upload e as três camadas de validação |
| [`docs/07-fases.md`](docs/07-fases.md) | 10 fases numeradas, cada uma verificável no browser |
| [`docs/08-riscos-gotchas.md`](docs/08-riscos-gotchas.md) | Os detalhes que quebram tarde se descobertos tarde |
| [`docs/09-verificacao.md`](docs/09-verificacao.md) | Checklist end-to-end de teste |
| [`docs/10-dependencias.md`](docs/10-dependencias.md) | O que instalar, por quê, e os scripts do `package.json` |

O arquivo [`CLAUDE.md`](CLAUDE.md) dá o contexto completo pro Claude Code quando você abrir este repo em outro computador.

---

## Como continuar (no outro computador)

```bash
git clone <este-repo> portfolio-site
cd portfolio-site
```

1. Abra o Claude Code na pasta — ele lê o `CLAUDE.md` automaticamente e já sabe todo o contexto.
2. Peça: **"vamos começar a Fase 0"** (ver [`docs/07-fases.md`](docs/07-fases.md)).
3. A Fase 0 faz o scaffold real (`create-next-app`), instala dependências e coloca no ar na Vercel. Só a partir daí existe código.
4. Copie `.env.example` para `.env.local` e preencha (você vai precisar de uma conta Neon, um token do Vercel Blob e gerar os segredos — instruções no próprio `.env.example`).

## Convenções

- Idioma: código e commits em português quando fizer sentido; termos técnicos e identificadores no original.
- Este repo começa como **documentação**; quando a Fase 0 rodar, o `create-next-app` traz a estrutura real do Next por cima.
