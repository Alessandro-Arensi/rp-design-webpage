// Homepage intro: GSAP curtain reveal on first visit only.
// First visit is armed in <head> (html.intro-play). Repeat visits, reduced-motion
// and no-JS all skip it and show the page immediately (content is visible by default).
export function initIntro() {
  const intro = document.querySelector("[data-intro]");
  if (!intro) return; // not the home page

  const gsap = window.gsap;
  const playing = document.documentElement.classList.contains("intro-play");

  // Repeat visit / reduced-motion / GSAP unavailable: drop the curtain, page as-is.
  if (!playing || !gsap) {
    intro.remove();
    return;
  }

  const html = document.documentElement;
  const lenis = window.__lenis;
  const wordmark = intro.querySelectorAll(".intro__wordmark .line > span");
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

  tl.from(wordmark, { yPercent: 110, duration: 1.0, stagger: 0.12 }, 0.2)
    .to(
      intro.querySelector(".intro__wordmark"),
      { letterSpacing: "0.22em", duration: 0.6 },
      1.4,
    )
    .to(wordmark, { yPercent: -110, duration: 0.7, stagger: 0.06 }, 2.0)
    .to(intro, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, 2.3) // curtain lift
    .from(heroImg, { scale: 1.12, duration: 1.6, ease: "power2.out" }, 2.9)
    .from(taglines, { yPercent: 120, duration: 1.0, stagger: 0.14 }, 3.1)
    .from(
      header,
      { yPercent: -100, autoAlpha: 0, duration: 0.9, ease: "power2.out" },
      3.1,
    )
    .from(cue, { autoAlpha: 0, y: 16, duration: 0.6 }, 3.9);

  // Safety: if anything stalls, never trap the user behind the curtain.
  window.setTimeout(() => {
    if (document.body.contains(intro)) cleanup();
  }, 8000);
}
