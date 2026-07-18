export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
        Fase 0 — scaffold no ar
      </span>
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
        Em construção
      </h1>
      <p className="max-w-md text-balance text-foreground/60">
        Pipeline de deploy provado. A experiência dirigida por scroll e o CMS
        próprio entram nas próximas fases.
      </p>
    </main>
  );
}
