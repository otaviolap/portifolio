import { SitePreloader } from "@/components/motion/SitePreloader";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";

// Layout do route group público. Preloader + SmoothScrollProvider (Lenis+GSAP)
// vivem aqui — o (admin) fica sem GSAP/Lenis. Header/footer entram depois.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
      <SitePreloader />
    </>
  );
}
