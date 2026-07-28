// Homepage intro: GSAP curtain on first visit. The curtain shows the hero's first
// carousel image while the logo (Lottie) signs itself, then crossfades up into the
// (identical) hero. First visit is armed in <head> (html.intro-play). Repeat visits,
// reduced-motion and no-JS all skip it and show the page immediately.

export function initIntro() {
  const intro = document.querySelector("[data-intro]");
  if (!intro) return; // not the home page

  const gsap = window.gsap;
  const playing = document.documentElement.classList.contains("intro-play");

  // Repeat visit / reduced-motion / GSAP unavailable: drop the curtain.
  if (!playing || !gsap) {
    intro.remove();
    return;
  }

  const html = document.documentElement;
  const lenis = window.__lenis;
  const header = document.querySelector(".s-header");
  const lottieBox = intro.querySelector("[data-intro-lottie]");
  let lottieAnim = null;

  // Lock scroll for the duration.
  html.style.overflow = "hidden";
  if (lenis) lenis.stop();

  const cleanup = () => {
    if (lottieAnim) lottieAnim.destroy();
    // Clear GSAP's lingering inline styles. A leftover transform on the header
    // makes it a containing block for the fixed mobile overlay (which would trap
    // the hamburger menu on first visit, while the intro has run).
    if (header) {
      gsap.set(header, { clearProps: "transform,opacity,visibility" });
    }
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

  // Fade the curtain out over the hero. The curtain's background IS the hero's
  // first slide (same image, same scale), so a plain opacity fade is a seamless
  // handoff — no scaling here, or the hero would visibly move against the curtain.
  // The hero's own Ken Burns zoom starts afterwards (hero.js, gated on curtain
  // removal), so it never fights this fade. Runs once.
  let lifted = false;
  const lift = () => {
    if (lifted) return;
    lifted = true;
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: cleanup,
    });
    tl.to(intro, { autoAlpha: 0, duration: 1.1 }, 0).from(
      header,
      { yPercent: -100, autoAlpha: 0, duration: 0.9, ease: "power2.out" },
      0.3,
    );
  };

  // Logo animation (Lottie), signing itself over the curtain image. Lazy-load the
  // vendored player (UMD: sets window.lottie as a side effect) so only the first-
  // visit intro pays for it. The curtain lifts when the signature completes; if the
  // player fails to load, lift immediately so we never trap the user.
  if (lottieBox) {
    import("/assets/js/vendor/lottie.min.js")
      .then(() => {
        if (!window.lottie || !document.body.contains(lottieBox)) {
          lift();
          return;
        }
        lottieAnim = window.lottie.loadAnimation({
          container: lottieBox,
          renderer: "svg",
          loop: false,
          autoplay: true,
          path: "/assets/lottie/logo.json",
        });
        lottieAnim.setSpeed(1.14); // sign a touch faster than the 4s source clip
        lottieAnim.addEventListener("complete", lift); // lift once the sign finishes
      })
      .catch(lift);
  } else {
    lift();
  }

  // Safety backstop: if the player stalls or never fires `complete`, never trap the
  // user behind the curtain. Comfortably past the ~3.5s signature + load time.
  window.setTimeout(lift, 6000);
}
