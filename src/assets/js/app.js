/* PIANA.DESIGN — app entry. Progressive enhancement: fully usable with no JS.
 * Lenis (smooth scroll) + GSAP intro are layered on top, both guarded for
 * reduced-motion / missing libs. */
import { initLenis } from "./modules/lenis.js";
import { initIntro } from "./modules/intro.js";
import { initNav } from "./modules/nav.js";
import { initHeader } from "./modules/header.js";
import { initReveal } from "./modules/reveal.js";
import { initGallery } from "./modules/gallery.js";

initLenis(); // before intro: intro pauses/resumes it during the curtain
initIntro();
initNav();
initHeader();
initReveal();
initGallery();
