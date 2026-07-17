# 03 — Animação (GSAP + ScrollTrigger + Lenis)

Este é o coração do "não-comum". Leia inteiro antes de codar qualquer efeito.

## 3.1 O provider: Lenis + GSAP ticker + ScrollTrigger

`src/components/motion/SmoothScrollProvider.tsx` (`"use client"`), montado no `(site)/layout.tsx` — **nunca** no admin.

O gotcha que economiza um dia: **você não precisa de `scrollerProxy`** enquanto o Lenis usar o scroll nativo do `window`/`body` (o padrão). Lenis intercepta o `wheel` e chama `window.scrollTo` — o browser realmente rola, então o ScrollTrigger lê `window.scrollY` corretamente. `scrollerProxy` só é necessário se você passar `wrapper`/`content` customizados (um `<div overflow:auto>`) — **não faça isso**, é a fonte da maioria dos bugs de pin.

Três fios obrigatórios:

```tsx
"use client";
import { ReactLenis, type LenisRef } from "lenis/react";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    // FIO 1: cada scroll do Lenis atualiza o ScrollTrigger na hora
    lenis.on("scroll", ScrollTrigger.update);

    // FIO 2: um único RAF loop — o do GSAP dirige o Lenis (por isso autoRaf={false})
    const raf = (time: number) => lenis.raf(time * 1000); // GSAP=s, Lenis=ms
    gsap.ticker.add(raf);

    // FIO 3: lagSmoothing pula frames em stall e dessincroniza o scrub
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();
    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33); // restaura o default
    };
  }, []);

  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1, duration: 1.2 }} ref={lenisRef}>
      {children}
    </ReactLenis>
  );
}
```

Cada fio previne um bug:
- **Dois RAF loops** (Lenis com `autoRaf` default + ticker do GSAP) → jitter em pin/scrub. Um loop só.
- `time * 1000` esquecido → Lenis recebe segundos, inércia parece congelada.
- `lagSmoothing` ligado → durante GC ou hydration pesada o GSAP "teleporta" o tempo e o scrub descola do Lenis.

**Refresh no route change** (efeito extra reagindo a `usePathname()`):
```ts
useEffect(() => {
  lenis?.scrollTo(0, { immediate: true });
  ScrollTrigger.refresh();
}, [pathname]);
```
**Obrigatório** — sem ele, ao navegar de `/projetos` pra `/`, os `start/end` dos pins ficam com as medidas da página anterior.

## 3.2 `useGSAP` — cleanup e Strict Mode

**Nunca `useEffect` cru com GSAP.** `useGSAP` do `@gsap/react` faz `gsap.context()` por baixo: toda tween/ScrollTrigger criada **dentro do callback** é revertida no unmount, e a re-execução em Strict Mode (double-mount do React 19 em dev) não duplica triggers. Sem ele você ganha triggers duplicados que só aparecem em dev e te fazem perder uma tarde.

Padrão canônico de todo componente em `components/motion/`:

```tsx
const container = useRef<HTMLDivElement>(null);

useGSAP(() => {
  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: "(min-width: 1024px)",
      isMobile: "(max-width: 1023px)",
      reduced: "(prefers-reduced-motion: reduce)",
    },
    (ctx) => {
      const { isDesktop, reduced } = ctx.conditions!;
      if (reduced) {
        gsap.set(".piece", { clearProps: "all", opacity: 1, x: 0, y: 0 });
        return; // estado final estático, zero ScrollTrigger
      }
      gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: isDesktop ? "+=2000" : "+=1200",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      // ...
    }
  );
}, { scope: container, dependencies: [] });
```

- `scope: container` → seletores string (`".piece"`) resolvem só dentro do ref. Sem isso, `gsap.to(".piece")` pega elementos de outra seção.
- `gsap.matchMedia` é o mecanismo de `prefers-reduced-motion` **e** de tuning mobile numa tacada: ao trocar o media query, o GSAP reverte automaticamente as animações do branch anterior.
- `invalidateOnRefresh: true` recalcula valores em resize (crítico quando `end` depende de altura).

## 3.3 "Imagem que se monta ao scrollar" — `ScrubAssembly`

Conceito: a imagem final é **fatiada em N peças** (PNGs com transparência, todas do mesmo tamanho do canvas final, cada uma contendo só sua parte). Cada peça é um `<img>` absolutamente posicionado em `inset-0`, deslocado/rotacionado/escalado do lugar. Ao scrollar, todas convergem para transform zero → a imagem "se monta".

`src/components/motion/ScrubAssembly.tsx`:

```tsx
"use client";
type Piece = { url: string; fromX: number; fromY: number; fromRotate: number; fromScale: number };

export function ScrubAssembly({ pieces, pinVh = 250, colorFrom, colorTo }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({ ok: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
      if (!ctx.conditions!.ok) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: `+=${pinVh}%`,
          scrub: 0.8,
          pin: ".assembly-stage",
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // as peças convergem — stagger para "montar" em cascata, não em bloco
      tl.from(".assembly-piece", {
        x: (i, el) => Number(el.dataset.fromX),
        y: (i, el) => Number(el.dataset.fromY),
        rotate: (i, el) => Number(el.dataset.fromRotate),
        scale: (i, el) => Number(el.dataset.fromScale),
        opacity: 0,
        ease: "power2.out",
        stagger: { each: 0.06, from: "random" },
      }, 0);

      // mudança de cor conforme o progresso — ver 3.5
      tl.to(".assembly-tint", { backgroundColor: colorTo, ease: "none" }, 0.4);

      // texto entra no fim do pin
      tl.from(".assembly-caption", { yPercent: 120, opacity: 0 }, 0.7);
    });
  }, { scope: root });

  return (
    <div ref={root} className="relative">
      <div className="assembly-stage h-svh grid place-items-center overflow-hidden">
        <div className="relative aspect-[4/3] w-[min(90vw,900px)]">
          {pieces.map((p, i) => (
            <img key={i} src={p.url} alt="" aria-hidden
              className="assembly-piece absolute inset-0 h-full w-full object-contain will-change-transform"
              data-from-x={p.fromX} data-from-y={p.fromY}
              data-from-rotate={p.fromRotate} data-from-scale={p.fromScale}
              fetchPriority={i < 3 ? "high" : "auto"} decoding="async" />
          ))}
          <div className="assembly-tint absolute inset-0 mix-blend-color pointer-events-none"
               style={{ backgroundColor: colorFrom }} />
        </div>
      </div>
    </div>
  );
}
```

Pontos não óbvios:
- `pin` aponta para um filho (`.assembly-stage`), **não** para o `trigger`. Pinar o próprio trigger com `pinSpacing` gera medições circulares em resize.
- `h-svh` e não `h-screen` — no iOS o `100vh` inclui a barra que some, e o pin "pula" quando ela recolhe.
- Só `transform` e `opacity` animados → composited, sem layout/paint.
- `will-change-transform` nas peças; remover depois se houver muitas (ver [`08-riscos-gotchas.md`](08-riscos-gotchas.md)).
- Posições de origem (`fromX/fromY`) vêm do JSONB (determinísticas, editáveis pelo admin) — **nunca** geradas com `Math.random()` no servidor (hydration mismatch).
- Alternativa se as peças ficarem pesadas (Fase 6): mesma lógica em canvas único (um `drawImage` por peça por frame).

## 3.4 Sequência de frames — canvas + preload

`src/components/motion/FrameSequenceCanvas.tsx`:

```tsx
"use client";
export function FrameSequenceCanvas({ baseUrl, frameCount, width, height, pinVh = 300 }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const images = useRef<HTMLImageElement[]>([]);
  const state = useRef({ frame: 0 });

  useGSAP(() => {
    const ctx2d = canvas.current!.getContext("2d", { alpha: false })!;

    const src = (i: number) => `${baseUrl}/${String(i + 1).padStart(4, "0")}.webp`;

    // preload: frame 0 primeiro (pinta imediato), depois o resto em background
    const load = (i: number) =>
      new Promise<HTMLImageElement>((res) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => res(img);
        img.onerror = () => res(img);
        img.src = src(i);
        images.current[i] = img;
      });

    let alive = true;
    const render = () => {
      const img = images.current[Math.round(state.current.frame)];
      if (!img?.complete || !img.naturalWidth) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.current!.width = width * dpr;
      canvas.current!.height = height * dpr;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.drawImage(img, 0, 0, width, height);
    };

    (async () => {
      await load(0);
      if (!alive) return;
      render();
      // carrega em ondas de 8 pra não estourar a fila de conexões
      for (let i = 1; i < frameCount && alive; i += 8) {
        await Promise.all(
          Array.from({ length: Math.min(8, frameCount - i) }, (_, k) => load(i + k))
        );
      }
      ScrollTrigger.refresh();
    })();

    const mm = gsap.matchMedia();
    mm.add({ ok: "(prefers-reduced-motion: no-preference)" }, (c) => {
      if (!c.conditions!.ok) { render(); return; }
      gsap.to(state.current, {
        frame: frameCount - 1,
        ease: "none",
        snap: "frame",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: `+=${pinVh}%`,
          scrub: 0.5,
          pin: ".seq-stage",
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        onUpdate: render,
      });
    });

    return () => { alive = false; };
  }, { scope: root });

  return (
    <div ref={root} className="relative">
      <div className="seq-stage h-svh grid place-items-center">
        <canvas ref={canvas} style={{ width, height }} className="max-w-full" />
      </div>
    </div>
  );
}
```

Pontos:
- Anima-se um **objeto** (`state.current.frame`), não o DOM. `snap: "frame"` evita `drawImage` de índice fracionário.
- `alpha: false` no contexto → composite mais barato.
- `ScrollTrigger.refresh()` após o preload: o layout pode ter mudado.
- Frames em WebP, ~60–90 no máximo, largura ≤1440, gerados fora do repo e **servidos do Blob** (não do `/public` — não infla o deploy).

## 3.5 Mudança de cor de elemento conforme o scroll

Três abordagens, em ordem de preferência:

1. **SVG inline** (melhor, quando a arte permite): exporte o elemento como SVG, dê `id` ao `<path>` alvo e `gsap.to("#logo-mark", { fill: "#FF4D00", ease: "none", scrollTrigger: { scrub: true } })`. GSAP interpola cor nativamente. Zero custo de imagem.
2. **Overlay com `mix-blend-mode`** (usado no `ScrubAssembly`): um `<div class="assembly-tint">` com `mix-blend-color` sobre a imagem; anima-se `backgroundColor`. Recolore de verdade mantendo luminância. Requer isolar a área — exporte a peça a recolorir como PNG separado e aplique o tint via `mask-image: url(peca.png)`.
3. **`filter: hue-rotate()`** — `gsap.to(el, { filter: "hue-rotate(140deg) saturate(1.4)" })`. Barato, mas `filter` no scrub força repaint por frame; só elementos pequenos.

Use 1 sempre que a peça for vetorial. `colorFrom`/`colorTo` são editados no JSONB da seção pelo admin.

## 3.6 Reveals de texto

`SplitTextReveal.tsx`. **Não use o plugin SplitText** (Club GreenSock) — split manual, cuidando de SEO/a11y:

```tsx
// o texto acessível fica intacto; a versão animada é aria-hidden
<span className="sr-only">{text}</span>
<span aria-hidden className="split-root">
  {words.map((w, i) => (
    <span key={i} className="inline-block overflow-hidden align-bottom">
      <span className="split-word inline-block will-change-transform">{w}</span>
    </span>
  ))}
</span>
```
```ts
gsap.from(".split-word", {
  yPercent: 110, opacity: 0, duration: 0.9, ease: "expo.out",
  stagger: 0.03,
  scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
});
```

O `<span className="sr-only">` com o texto completo garante que leitor de tela e o parser leem uma frase, não N fragmentos. O HTML do servidor já contém o texto completo → SEO preservado.

## 3.7 Transição de página

`(site)/template.tsx` (não `layout.tsx` — `template` remonta a cada navegação, que é o que queremos):

```tsx
"use client";
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from(ref.current, { opacity: 0, y: 24, duration: 0.6, ease: "power2.out" });
  }, { scope: ref });
  return <div ref={ref}>{children}</div>;
}
```

Exit animations reais (cortina cobrindo a tela antes da nav) ficam para **depois da Fase 8** (`next-view-transitions` ou overlay controlado). `template.tsx` cobre 80% do efeito com 5% do risco.

## 3.8 Bundle de GSAP

Um único módulo `src/lib/gsap.ts` faz `registerPlugin` uma vez e reexporta. Todos os componentes de motion importam dele. Os mais pesados (`FrameSequenceCanvas`, `ScrubAssembly`) entram via `next/dynamic` com `ssr: false` **apenas se** estiverem abaixo da dobra — o hero não. Cuidado: `ssr: false` = HTML vazio pro crawler, então só em componentes **puramente decorativos**.
