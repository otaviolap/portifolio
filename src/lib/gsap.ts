// registerPlugin UMA vez; todo componente de motion importa daqui.
// Nunca `import "gsap/all"` (traz o bundle inteiro).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
