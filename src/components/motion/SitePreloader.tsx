"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Preloader editorial (estética Awwwards/Apple): restrição total.
 * Off-white sobre quase-preto, um único acento de ouro. Nada de partículas,
 * glow ou brilho — a força vem da tipografia e do timing.
 *
 * Intro — o monograma "OG" sobe de trás de uma máscara (overflow:hidden) em
 *   stagger com easing expo; uma hairline dourada preenche como progresso e um
 *   contador conta 0→100.
 * Saída — o conteúdo levanta e desaparece, e a cortina preta sobe (curtain
 *   lift) com power4, revelando o site num único movimento decidido.
 *
 * Salvaguardas: prefers-reduced-motion entrega tudo pronto e sai suave; um
 * timeout de 15s garante que a página nunca trava.
 */

const LETTERS = ["O", "G"];

export function SitePreloader() {
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const revealedRef = useRef(false);

  useGSAP(
    () => {
      const root = rootRef.current!;
      document.documentElement.style.overflow = "hidden";
      gsap.set(root, { willChange: "transform" });

      const setCount = (v: number) => {
        if (countRef.current) countRef.current.textContent = String(Math.round(v));
      };

      const mm = gsap.matchMedia();

      // --- reduced motion: tudo pronto, saída curta ---
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".pl-char", { yPercent: 0 });
        gsap.set(".pl-progress", { scaleX: 1 });
        gsap.set(".pl-meta", { opacity: 1 });
        setCount(100);
        window.setTimeout(reveal, 700);
      });

      // --- experiência completa ---
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(".pl-char", { yPercent: 110 });
        gsap.set(".pl-progress", { scaleX: 0, transformOrigin: "left center" });
        gsap.set(".pl-meta", { opacity: 0 });

        const counter = { v: 0 };
        const LOAD_DURATION = 2.9;

        gsap
          .timeline({ onComplete: () => window.setTimeout(reveal, 400) })
          // letras sobem da máscara
          .to(".pl-char", { yPercent: 0, duration: 1.0, ease: "expo.out", stagger: 0.09 }, 0.15)
          // meta (tag + contador) surge
          .to(".pl-meta", { opacity: 1, duration: 0.8, ease: "power2.out" }, 0.35)
          // hairlines de progresso (grande + a do contador) preenchem juntas + contador sobe
          .to(".pl-progress", { scaleX: 1, duration: LOAD_DURATION, ease: "power2.inOut" }, 0.4)
          .to(
            counter,
            { v: 100, duration: LOAD_DURATION, ease: "power2.inOut", onUpdate: () => setCount(counter.v) },
            0.4,
          );
      });

      const safety = window.setTimeout(reveal, 15000);
      return () => {
        window.clearTimeout(safety);
        document.documentElement.style.overflow = "";
      };
    },
    { scope: rootRef },
  );

  function finish() {
    document.documentElement.style.overflow = "";
    // qualquer medição feita por baixo do overlay (fontes, imagens) pode ter
    // acontecido com o layout ainda assentando — recalcula os pins agora
    ScrollTrigger.refresh();
    setDone(true);
  }

  function reveal() {
    if (revealedRef.current) return;
    revealedRef.current = true;

    const root = rootRef.current;
    const content = contentRef.current;

    gsap
      .timeline({ onComplete: finish })
      // conteúdo levanta e some
      .to(content, { yPercent: -35, opacity: 0, duration: 0.8, ease: "power3.inOut", overwrite: "auto" }, 0)
      // cortina preta sobe revelando o site (movimento único e decidido)
      .to(root, { yPercent: -100, duration: 1.05, ease: "power4.inOut" }, 0.12);
  }

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] overflow-hidden bg-[#0a0a0b] text-[#ecebe4]"
      aria-hidden
    >
      <div ref={contentRef} className="absolute inset-0 flex flex-col items-center justify-center">
        {/* monograma com reveal mascarado */}
        <div className="flex overflow-hidden leading-[0.9]" style={{ paddingBottom: "0.08em" }}>
          {LETTERS.map((ch) => (
            <span key={ch} className="overflow-hidden">
              <span
                className="pl-char inline-block font-semibold"
                style={{
                  fontSize: "clamp(4.5rem, 17vw, 12rem)",
                  letterSpacing: "-0.02em",
                  fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
                }}
              >
                {ch}
              </span>
            </span>
          ))}
        </div>

        {/* hairline de progresso (único acento de ouro) */}
        <div className="pl-meta mt-8 h-px w-[min(58vw,320px)] bg-white/10">
          <div className="pl-progress h-full w-full origin-left bg-[#c29b4b]" />
        </div>
      </div>

      {/* meta inferior: tag à esquerda, contador à direita (grid editorial) */}
      <div className="pl-meta absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-6 text-[11px] uppercase tracking-[0.28em] text-white/45 sm:px-10 sm:pb-8">
        <span>Otávio & Gustavo — Portfólio</span>
        <span className="flex flex-col items-end gap-2">
          <span className="tabular-nums tracking-[0.2em] text-white/70">
            <span ref={countRef}>0</span>
            <span className="text-white/35">%</span>
          </span>
          {/* hairline própria do contador, preenche em sincronia com o número */}
          <span className="block h-px w-16 bg-white/10">
            <span className="pl-progress block h-full w-full origin-left bg-[#c29b4b]" />
          </span>
        </span>
      </div>
    </div>
  );
}
