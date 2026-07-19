import { SplitTextReveal } from "@/components/motion/SplitTextReveal";
import { RevealOnScroll } from "@/components/motion/RevealOnScroll";
import { PinScrubDemo } from "@/components/motion/PinScrubDemo";

// Server Component: compõe seções e delega o movimento a filhos client de
// components/motion/*. O texto sai completo no HTML do servidor (SEO/a11y);
// os wrappers client só animam nós que o servidor já emitiu (regra do doc 04).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* HERO */}
      <section className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
          Fase 4 — fundação de animação
        </span>
        <SplitTextReveal
          as="h1"
          text="Experiência dirigida por scroll"
          className="max-w-4xl text-balance text-5xl font-semibold tracking-tight sm:text-7xl"
        />
        <RevealOnScroll delay={0.3}>
          <p className="max-w-md text-balance text-foreground/60">
            Lenis + GSAP ScrollTrigger provados. Role para ver o scroll suave, o
            texto revelando e a seção pinando.
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.5} className="mt-4">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40">
            ↓ role
          </span>
        </RevealOnScroll>
      </section>

      {/* SEÇÃO-COBAIA: pin + scrub (descartável na Fase 5/6) */}
      <PinScrubDemo />

      {/* REVEALS no scroll — provam o ScrollTrigger disparando ao entrar na viewport */}
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-24 px-6 py-40">
        {[
          "Screenshots reais dos projetos",
          "CMS próprio em /admin",
          "Efeitos pesados na Fase 6",
        ].map((t, i) => (
          <RevealOnScroll key={t}>
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-foreground/40">
                0{i + 1}
              </span>
              <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t}
              </h3>
              <div className="h-px w-full bg-foreground/10" />
            </div>
          </RevealOnScroll>
        ))}
      </section>
    </main>
  );
}
