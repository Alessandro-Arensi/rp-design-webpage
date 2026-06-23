// Homepage intro: GSAP curtain on first visit. The "Roberto Piana" signature
// draws itself stroke by stroke, then the curtain lifts into the hero.
// First visit is armed in <head> (html.intro-play). Repeat visits, reduced-motion
// and no-JS all skip it and show the page immediately (content is visible by default).
import { setupSignature } from "./logo-draw.js";

export function initIntro() {
  const intro = document.querySelector("[data-intro]");
  if (!intro) return; // not the home page

  const gsap = window.gsap;
  const playing = document.documentElement.classList.contains("intro-play");
  const svg = intro.querySelector("[data-logo-sign]");

  // Repeat visit / reduced-motion / GSAP unavailable / no signature: drop the curtain.
  if (!playing || !gsap || !svg) {
    intro.remove();
    return;
  }

  const html = document.documentElement;
  const lenis = window.__lenis;
  const heroImg = document.querySelector(".s-hero__media img");
  const taglines = document.querySelectorAll(".s-hero__tagline .line > span");
  const header = document.querySelector(".s-header");
  const cue = document.querySelector(".s-hero__scroll");

  // Lock scroll for the duration.
  html.style.overflow = "hidden";
  if (lenis) lenis.stop();

  const cleanup = () => {
    // Clear GSAP's lingering inline styles. A leftover transform on the header
    // makes it a containing block for the fixed mobile overlay (which would trap
    // the hamburger menu on first visit, while the intro has run).
    gsap.set([header, heroImg, cue, ...taglines].filter(Boolean), {
      clearProps: "transform,opacity,visibility",
    });
    intro.remove();
    html.style.overflow = "";
    html.classList.remove("intro-play");
    if (lenis) lenis.start();
    try {
      sessionStorage.setItem("piana_intro", "1");
    } catch {
      /* private mode */
    }
  };

  // Build the signature's clip-paths/masks + hidden initial state (no flash).
  const sign = setupSignature(svg, gsap);

  const tl = gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete: cleanup,
  });

  const drawStart = 0.3;
  sign.addTo(tl, drawStart); // hand-writes "Roberto Piana"
  const lift = drawStart + sign.duration - 0.15; // lift just as the ink lands

  // Crossfade the curtain (it shares the hero's signature position/size, so the
  // drawn "Roberto Piana" settles seamlessly into the static hero signature).
  tl.to(intro, { autoAlpha: 0, duration: 1.1, ease: "power2.inOut" }, lift)
    .from(
      heroImg,
      { scale: 1.12, duration: 1.6, ease: "power2.out" },
      lift + 0.6,
    )
    .from(
      header,
      { yPercent: -100, autoAlpha: 0, duration: 0.9, ease: "power2.out" },
      lift + 0.8,
    )
    .from(cue, { autoAlpha: 0, y: 16, duration: 0.6 }, lift + 1.6);

  // Safety: if anything stalls, never trap the user behind the curtain.
  window.setTimeout(() => {
    if (document.body.contains(intro)) cleanup();
  }, 9000);
}
