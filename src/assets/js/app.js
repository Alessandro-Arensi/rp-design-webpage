/* PIANA — app entry. Progressive enhancement: fully usable with no JS.
 * Lenis (smooth scroll) + GSAP intro are layered on top, both guarded for
 * reduced-motion / missing libs. */
import { initGallery } from "./modules/gallery.js";
import { initHeader } from "./modules/header.js";
import { initHeroSlideshow } from "./modules/hero.js";
import { initIntro } from "./modules/intro.js";
import { initLenis } from "./modules/lenis.js";
import { initNav } from "./modules/nav.js";
import { initReveal } from "./modules/reveal.js";

initLenis(); // before intro: intro pauses/resumes it during the curtain
initIntro();
initHeroSlideshow(); // after intro: hero.js waits for the curtain to clear
initNav();
initHeader();
initReveal();
initGallery();
