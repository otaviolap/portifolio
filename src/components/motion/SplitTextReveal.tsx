"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

type Props = {
  text: string;
  /** tag semântica do container — o texto acessível sai completo dentro dela */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  /** onde o reveal dispara no scroll (ScrollTrigger start) */
  start?: string;
};

/**
 * Reveal de texto palavra a palavra no scroll. Split MANUAL (sem o plugin
 * SplitText do Club): o texto acessível fica intacto num <span class="sr-only">
 * e a versão animada é aria-hidden. O HTML do servidor já contém a frase
 * completa → SEO/a11y preservados. `gsap.from` + matchMedia → sem JS ou com
 * reduced-motion o texto aparece estático. Ver doc 03.6.
 */
export function SplitTextReveal({
  text,
  as = "span",
  className,
  delay = 0,
  start = "top 80%",
}: Props) {
  const root = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".split-word", {
          yPercent: 110,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.03,
          delay,
          scrollTrigger: { trigger: root.current, start, once: true },
        });
      });
    },
    { scope: root },
  );

  const Tag = as as React.ElementType;

  return (
    <Tag ref={root} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-block">
        {words.map((w, i) => (
          <span
            key={i}
            className="mr-[0.25em] inline-block overflow-hidden align-bottom"
          >
            <span className="split-word inline-block will-change-transform">
              {w}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
