import { SitePreloader } from "@/components/motion/SitePreloader";

// Layout do route group público. O preloader (e, na Fase 4, o
// SmoothScrollProvider + header/footer) vivem aqui — o (admin) fica sem GSAP.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <SitePreloader />
    </>
  );
}
