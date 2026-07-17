# 00 — Visão geral

## O problema / a necessidade

O Otávio quer um site de portfólio para a empresa dele. Não um site comum: um site **nível Awwwards/Apple**, onde descer a página é a experiência — imagem que se monta peça por peça ao scrollar, sequência de frames como as landings de produto da Apple, elemento de uma foto que muda de cor conforme o progresso do scroll.

Além do "uau" visual, o site tem uma exigência funcional concreta: listar os projetos que ele desenvolveu (**foto da página + link para acessar o site no ar**) e ser **editável pela própria URL, com login**, para adicionar/alterar conteúdo sem mexer em código — no espírito do Atena da Codie, mas 100% dele, funcionando só pra ele.

## Resultado pretendido

- Uma landing animada que impressiona e é leve o suficiente pra rankear no Google.
- Um portfólio de projetos alimentável pelo próprio dono.
- Um `/admin` com login onde ele edita projetos, textos da home e lê os contatos recebidos.
- Tudo num stack que ele domina (React/TS) e que roda barato (free tiers).

## Decisões fechadas e o porquê

| Decisão | Escolha | Por quê |
|---|---|---|
| Front + back | **Next.js 15 full-stack** | Portfólio precisa de SEO → SSR. Um back Node separado seria 2º deploy + CORS + auth cross-domain sem ganho; o back (CRUD, upload, login) cabe todo em Route Handlers + Server Actions, que já são Node. |
| Banco | **Neon + Prisma** | Postgres serverless com free tier generoso; Prisma dá schema tipado em TS. Relacional encaixa em Projetos/Techs/Seções melhor que Mongo. |
| Imagens | **Vercel Blob (client upload)** | Screenshots são arquivos, não cabem no banco. Client upload contorna o limite de 4.5MB do Route Handler na Vercel. |
| Auth | **Própria** (bcrypt + JWT `jose`) | Um único admin (o Otávio). NextAuth seria peso morto; ~40 linhas resolvem, sem lock-in. |
| Animação | **GSAP + ScrollTrigger + Lenis** | É o padrão dos sites Awwwards. Framer Motion não faz o scroll-scrub pesado (pin + timeline) que o efeito Apple exige. |
| Deploy | **Vercel** | Deploy do Next em um comando, Blob e Postgres integrados, free tier atende. |
| CMS (Neon+Prisma vs Payload vs Supabase) | **Neon + Prisma** | O admin é pequeno (projetos, textos, leads). Escrever 3 telas de React é menos peso que carregar o framework do Payload; e sem depender de SDK/RLS de terceiro como no Supabase. |

### O que foi descartado e por quê

- **Vite + React SPA + Express separado** — sem SSR (SEO ruim), dois deploys, CORS, auth cross-domain. Descartado.
- **Payload CMS** — gera o admin sozinho (economiza ~1 semana), mas o esqueleto do painel segue as convenções dele. Como o admin aqui é simples, a economia não paga carregar o framework. Descartado, mas era a 2ª opção defensável.
- **Supabase** — Postgres + Auth + Storage prontos, mas amarra no SDK e move a segurança pra policies RLS no painel deles, fora do repo. Overkill pra um admin único. Descartado.
- **Framer Motion** — ótimo pra entrada (fade/slide/stagger), mas o pin+scrub estilo Apple fica capenga. Descartado como motor principal.

## A tensão central do projeto

Animação pesada e SEO puxam em direções opostas: animação quer JS controlando tudo no client; SEO quer HTML pronto no servidor. A regra que resolve isso — **Server Component renderiza o conteúdo, Client Component só anima o que já está no HTML** — está detalhada em [`04-renderizacao-seo.md`](04-renderizacao-seo.md) e é o eixo de todo o resto.

## Escopo do admin

Editável via `/admin` (login):
- **CRUD de projetos**: título, slug, descrição, screenshot (upload), liveUrl, repoUrl, tecnologias/tags, ordem, publicado/rascunho.
- **Textos e seções da home**: cada seção é conteúdo no banco (JSONB), editável sem código.
- **Leads**: leitura dos contatos recebidos pelo formulário.

Fora de escopo (por ora): blog/artigos, multi-tenant, multi-usuário.

## Assets pesados

As peças fatiadas do efeito "imagem que se monta" e os frames da sequência estilo Apple ainda **não existem**. O plano usa **placeholder funcional** — os componentes ficam prontos e funcionando com assets gerados; o Otávio troca pelos reais depois, pelo admin.
