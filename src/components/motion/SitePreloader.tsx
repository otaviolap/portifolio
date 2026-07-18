"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Tela de loading do site: toca /loading.mp4 em 2x e, ao terminar, o vídeo
 * dá um zoom+fade e a cortina preta sobe revelando o site.
 * Salvaguardas: autoplay bloqueado, erro de mídia ou prefers-reduced-motion
 * revelam o site na hora (nunca trava a página).
 */
export function SitePreloader() {
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const revealedRef = useRef(false);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) {
        finish();
        return;
      }

      document.documentElement.style.overflow = "hidden";

      const v = videoRef.current;
      if (v) {
        v.playbackRate = 2; // toca em dobro
        v.play().catch(reveal); // autoplay bloqueado → revela direto
      }

      // trava-zero: se o vídeo nunca terminar/carregar, revela em 15s
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
    setDone(true);
  }

  function reveal() {
    if (revealedRef.current) return;
    revealedRef.current = true;
    gsap
      .timeline({ onComplete: finish })
      .to(videoRef.current, {
        scale: 1.08,
        opacity: 0,
        duration: 0.6,
        ease: "power2.in",
      })
      .to(
        rootRef.current,
        { yPercent: -100, duration: 0.8, ease: "power4.inOut" },
        "-=0.25",
      );
  }

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      aria-hidden
    >
      <video
        ref={videoRef}
        src="/loading.mp4"
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = 2;
        }}
        onEnded={reveal}
        onError={reveal}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
