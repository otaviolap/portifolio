"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Seção-cobaia da Fase 4: prova pin + scrub + tint scrubando com Lenis, numa
 * seção só (o barato de errar aqui). Padrão canônico do doc 03.2: matchMedia
 * para reduced-motion e tuning mobile, pin num filho (.demo-stage), não no
 * próprio trigger. Descartável quando as seções reais (Fase 5/6) existirem.
 */
export function PinScrubDemo() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
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
            // estado final estático, zero ScrollTrigger
            gsap.set(".demo-word", { yPercent: 0, opacity: 1 });
            gsap.set(".demo-bar", { scaleX: 1 });
            return;
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: isDesktop ? "+=1600" : "+=1000",
              scrub: 1,
              pin: ".demo-stage",
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          tl.from(
            ".demo-word",
            { yPercent: 120, opacity: 0, stagger: 0.15, ease: "power2.out" },
            0,
          )
            .fromTo(
              ".demo-bar",
              { scaleX: 0 },
              { scaleX: 1, ease: "none" },
              0,
            )
            // tint do fundo conforme o progresso — claro → escuro
            .to(
              ".demo-stage",
              { backgroundColor: "#0b0b0f", color: "#f5f5f0", ease: "none" },
              0,
            )
            .to(
              ".demo-ring",
              { rotate: 220, scale: 1.35, ease: "none" },
              0,
            );
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative">
      <section className="demo-stage grid h-svh place-items-center overflow-hidden bg-[#f5f5f0] text-[#0b0b0f]">
        <div className="relative flex flex-col items-center gap-8 px-6 text-center">
          <div className="demo-ring pointer-events-none absolute -z-10 h-[60vmin] w-[60vmin] rounded-full border border-current opacity-20" />
          <p className="font-mono text-xs uppercase tracking-[0.4em] opacity-60">
            Fase 4 — pin + scrub provado
          </p>
          <h2 className="flex flex-wrap justify-center gap-x-4 text-5xl font-semibold tracking-tight sm:text-7xl">
            {["scroll", "dirige", "tudo"].map((w) => (
              <span key={w} className="inline-block overflow-hidden align-bottom">
                <span className="demo-word inline-block will-change-transform">
                  {w}
                </span>
              </span>
            ))}
          </h2>
          <div className="demo-bar h-px w-64 origin-left bg-current" />
        </div>
      </section>
    </div>
  );
}
