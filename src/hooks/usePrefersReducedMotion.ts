"use client";

import { useEffect, useState } from "react";

/**
 * Lê `prefers-reduced-motion` reativamente (reage ao toggle do SO, não só no
 * mount). Para componentes que precisam do valor em JS — o mecanismo principal
 * de reduced-motion continua sendo o `gsap.matchMedia` dentro de cada animação
 * (ver doc 03). SSR-safe: assume movimento e corrige no mount.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
