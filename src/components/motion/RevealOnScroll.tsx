"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

type Props = {
  children: React.ReactNode;
  className?: string;
  y?: number;
  duration?: number;
  delay?: number;
  start?: string;
};

/**
 * Envelope client que anima a ENTRADA de conteúdo já renderizado pelo servidor
 * (padrão wrapper-client / children-server do doc 04). `gsap.from` → sem JS o
 * conteúdo aparece normal, e com reduced-motion o branch nem roda. Só transform
 * e opacity → composited, sem layout/paint.
 */
export function RevealOnScroll({
  children,
  className,
  y = 40,
  duration = 0.9,
  delay = 0,
  start = "top 85%",
}: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current, {
          y,
          opacity: 0,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start, once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
