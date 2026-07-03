// Homepage intro: GSAP curtain on first visit. The "Roberto Piana" logo fades in,
// then the curtain lifts into the hero (whose static logo matches its position/size,
// so the mark settles seamlessly).
// First visit is armed in <head> (html.intro-play). Repeat visits, reduced-motion
// and no-JS all skip it and show the page immediately (content is visible by default).

export function initIntro() {
  const intro = document.querySelector("[data-intro]");
  if (!intro) return; // not the home page

  const gsap = window.gsap;
  const playing = document.documentElement.classList.contains("intro-play");
  const logo = intro.querySelector(".intro__sign img");

  // Repeat visit / reduced-motion / GSAP unavailable / no logo: drop the curtain.
  if (!playing || !gsap || !logo) {
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

  const tl = gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete: cleanup,
  });

  // Slight fade-in of the logo (starts hidden via CSS, so no flash), then hold.
  tl.to(logo, { autoAlpha: 1, duration: 1.4, ease: "power2.out" }, 0.3);
  const lift = 2.1; // lift the curtain after the logo has settled

  // Crossfade the curtain (it shares the hero's logo position/size, so the
  // "Roberto Piana" mark settles seamlessly into the static hero signature).
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
