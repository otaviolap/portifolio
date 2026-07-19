"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Transição de entrada de página. É `template` (não `layout`) de propósito:
 * o template REMONTA a cada navegação, então a animação roda em toda troca de
 * rota. Cobre ~80% do efeito com ~5% do risco (exit real fica pós-Fase 8).
 * `flex flex-1 flex-col` preserva o layout que as páginas esperam do <body>.
 */
export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          ease: "power2.out",
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="flex flex-1 flex-col">
      {children}
    </div>
  );
}
