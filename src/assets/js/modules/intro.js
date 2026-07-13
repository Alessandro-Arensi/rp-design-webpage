// Homepage intro: GSAP curtain on first visit. A full-screen video (the art
// director's dolly-in) plays, then the curtain crossfades up into the hero.
// First visit is armed in <head> (html.intro-play). Repeat visits, reduced-motion
// and no-JS all skip it and show the page immediately (content is visible by default).
// NOTE: the signature-writing animation is disabled for now — see intro.njk.

export function initIntro() {
  const intro = document.querySelector("[data-intro]");
  if (!intro) return; // not the home page

  const gsap = window.gsap;
  const playing = document.documentElement.classList.contains("intro-play");
  const video = intro.querySelector("[data-intro-video]");

  // Repeat visit / reduced-motion / GSAP unavailable: drop the curtain.
  if (!playing || !gsap) {
    intro.remove();
    return;
  }

  const html = document.documentElement;
  const lenis = window.__lenis;
  const heroImg = document.querySelector(".s-hero__media img");
  const header = document.querySelector(".s-header");

  // Lock scroll for the duration.
  html.style.overflow = "hidden";
  if (lenis) lenis.stop();

  const cleanup = () => {
    // Clear GSAP's lingering inline styles. A leftover transform on the header
    // makes it a containing block for the fixed mobile overlay (which would trap
    // the hamburger menu on first visit, while the intro has run).
    gsap.set([header, heroImg].filter(Boolean), {
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

  // Crossfade the curtain up into the hero. Runs once.
  let lifted = false;
  const lift = () => {
    if (lifted) return;
    lifted = true;
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: cleanup,
    });
    tl.to(intro, { autoAlpha: 0, duration: 1.1 }, 0)
      .from(heroImg, { scale: 1.12, duration: 1.6, ease: "power2.out" }, 0.5)
      .from(
        header,
        { yPercent: -100, autoAlpha: 0, duration: 0.9, ease: "power2.out" },
        0.7,
      );
  };

  // Play the video (muted + inline so it autoplays on mobile); if it's blocked
  // or errors, lift immediately.
  if (video) {
    const p = video.play && video.play();
    if (p && typeof p.catch === "function") p.catch(lift);
    video.addEventListener("ended", lift, { once: true });
    video.addEventListener("error", lift, { once: true });
  } else {
    lift();
  }

  // Cap the curtain at 3.5s — we don't play the full clip. Lifts at 3.5s, or
  // sooner if a shorter video fires `ended` first (whichever comes first).
  window.setTimeout(lift, 3500);
}
