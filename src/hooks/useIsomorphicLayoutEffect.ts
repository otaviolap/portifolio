import { useEffect, useLayoutEffect } from "react";

// useLayoutEffect no cliente, useEffect no servidor — evita o warning de SSR
// do React quando um efeito de layout roda sem DOM.
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
