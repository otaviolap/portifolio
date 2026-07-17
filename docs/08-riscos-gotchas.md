# 08 — Riscos e gotchas concretos

Os detalhes que, se descobertos tarde, custam caro. Releia antes das fases relevantes.

## ScrollTrigger + pin em mobile

- **`100vh` no iOS:** a barra de endereço recolhendo muda a viewport → o ScrollTrigger refaz o cálculo → o pin salta. Use `h-svh`/`100svh` e `ScrollTrigger.config({ ignoreMobileResize: true })`.
- **`scrub` + `pin` é caro:** cada frame recalcula. Em mobile, prefira `matchMedia` com `end` menor, `scrub: true` (sem smoothing) e, nas seções mais pesadas, substitua o scrub por um trigger `once: true` com timeline autônoma. Não é a mesma experiência — é a experiência que roda.
- **`pinType`:** em touch o ScrollTrigger usa `transform` em vez de `position: fixed`. Se algo dentro do pin usar `position: fixed`, ele quebra (containing block muda). **Nada `fixed` dentro de área pinada.**
- **Ordem de refresh:** imagens sem `width`/`height` carregam depois do ScrollTrigger medir → todos os `start/end` errados. Todas as imagens com dimensões explícitas (por isso `coverWidth/Height` no schema), e `ScrollTrigger.refresh()` após o preload da sequência.
- **Muitos `will-change`:** promove camada por elemento; 40 peças com `will-change: transform` = GPU memory estourando em celular médio. Aplique só durante a animação (alternando classe no `onStart`/`onComplete`) ou limite a ~10 peças.

## LCP com animação pesada

- O elemento LCP (headline do hero ou imagem principal) **não pode nascer com `opacity: 0`**. O Chrome não conta como pintado; o LCP dispara quando o GSAP hidrata → 2s+ de penalidade. Hero: texto visível no HTML, animação de entrada via `gsap.from` com `yPercent` (transform não afeta a detecção de LCP) e sem opacity inicial zero — ou aceite um `fade` de duração ≤200ms.
- `SmoothScrollProvider` envolve tudo e é client → o `<body>` fica dentro de um client boundary. Isso **não** impede SSR (client components são pré-renderizados), mas o custo de hydration atrasa a interatividade. Mantenha o provider magrinho — só o Lenis, nada de estado global.
- Sequência de frames: 60 WebP × ~80KB = ~5MB. **Nunca** dispare esse preload junto com o hero. Só comece a carregar quando a seção estiver a ~1 viewport de distância (`start: "top bottom+=100%"`, `once: true` → dispara o loader).
- Fonts com `next/font/local` + `display: 'swap'` + `preload`. Fonte via CDN externo é o assassino silencioso de LCP em site de agência.

## Neon cold start

- Neon free/launch **suspende o compute após ~5 min** de inatividade. O próximo request paga ~500ms–2s pra acordar. Num portfólio com tráfego irregular, quase todo visitante pagaria isso.
- **Mitigação principal:** a home e as páginas de projeto são **estáticas** (ISR com tag). O visitante não toca o banco — só o admin e o `POST /api/leads` tocam. Isso transforma o cold start de "todo mundo sofre" em "o Otávio espera 1s ao abrir o admin".
- Use **sempre a pooled URL** (`-pooler`, `pgbouncer=true`) na `DATABASE_URL`. Serverless não reusa conexão; sem PgBouncer você esgota o limite de conexões da Neon em qualquer pico. `DIRECT_URL` só para migrations.
- Singleton do Prisma com `globalThis` (evita N clients em dev com HMR).
- `connect_timeout=15` na connection string — o default é curto demais para um cold start; você veria `P1001` em vez de esperar.
- Se incomodar no admin: cron da Vercel batendo `SELECT 1` a cada 4 min (custo: compute quase sempre ligado) ou upgrade de autosuspend.

## Bundle GSAP

- `gsap` core + `ScrollTrigger` ≈ 70KB gzip; `lenis` ≈ 8KB. É o preço do requisito. Mitigações:
  - **Nunca** `import gsap/all` — traz todos os plugins. Importe `gsap` e `gsap/ScrollTrigger` nominalmente.
  - `registerPlugin` **num único módulo** (`lib/gsap.ts`).
  - `(admin)/*` **não importa GSAP nem Lenis** — route group separado garante isso; verifique com `@next/bundle-analyzer`.
  - Componentes de motion abaixo da dobra via `next/dynamic({ ssr: false })` — mas `ssr: false` = HTML vazio pro crawler: **só em componentes puramente decorativos**, nunca nos que carregam texto/links.

## Acessibilidade

- `prefers-reduced-motion` via `gsap.matchMedia()` em **todo** componente de motion — é o mecanismo, não um extra. Estado reduzido = conteúdo final visível, sem pin, sem scrub.
- **Lenis precisa ser desligado** com reduced motion: `lenis.stop()` ou não montar o `ReactLenis`. Smooth scroll é exatamente o tipo de movimento que a preferência pede pra remover; muita gente esquece e trata só as tweens.
- **Pin quebra navegação por teclado:** ao dar Tab num link dentro de área pinada, o browser tenta scrollar até ele e o ScrollTrigger briga. Evite conteúdo focável dentro de seções pinadas com scrub longo; se precisar, escute `focusin` e faça `lenis.scrollTo(elemento)`.
- Texto split: sempre o `<span className="sr-only">` com a frase inteira + `aria-hidden` no split (doc 03.6).
- Canvas de sequência: `role="img"` + `aria-label` descritivo, ou `aria-hidden` se for puramente decorativo.
- Contraste: paleta "Awwwards" tende a cinza-sobre-preto (#666 em #111 = 3.5:1, reprova). Fixe ≥4.5:1 para texto de corpo desde o design.

## Outros

- **Strict Mode do React 19** monta o efeito duas vezes em dev. Sem `useGSAP`, triggers duplicados que só aparecem em dev. `useGSAP` resolve — **use sempre**.
- **Hydration mismatch** por `new Date()`/`Math.random()` em Server Component. O `stagger: { from: "random" }` do GSAP roda no client (seguro). Mas **não** gere as posições `fromX/fromY` das peças aleatoriamente no servidor — elas vêm do JSONB (determinísticas, editáveis).
- **`Decimal`/`Date` do Prisma cruzando pra client** → erro de serialização. O DAL retorna DTOs planos, não entidades cruas.
- **Rate limit em serverless é in-memory e não confiável** (cada lambda tem seu Map). O Map em memória cobre o caso casual em `/api/leads` e `/api/auth/login`; se aparecer abuso real, mover para Upstash Redis ou tabela `RateLimit` na Neon. Comece simples, documente a limitação.
