"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, type LenisRef } from "lenis/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Wiring Lenis + GSAP ticker + ScrollTrigger. Montado SÓ no (site)/layout — o
 * (admin) fica sem Lenis/GSAP (separação por route group). Ver doc 03.1 para os
 * três fios obrigatórios e por que não usamos `scrollerProxy`.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<LenisRef>(null);
  const pathname = usePathname();

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    // FIO 1: cada scroll do Lenis atualiza o ScrollTrigger na hora
    lenis.on("scroll", ScrollTrigger.update);

    // FIO 2: um único RAF loop — o do GSAP dirige o Lenis (por isso autoRaf=false)
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

  // Refresh no route change: sem isso, ao navegar /projetos <-> /, os start/end
  // dos pins ficam com as medidas da página anterior.
  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    lenis?.scrollTo(0, { immediate: true });
    ScrollTrigger.refresh();
  }, [pathname]);

  return (
    <ReactLenis
      root
      options={{ autoRaf: false, lerp: 0.1, duration: 1.2 }}
      ref={lenisRef}
    >
      {children}
    </ReactLenis>
  );
}
