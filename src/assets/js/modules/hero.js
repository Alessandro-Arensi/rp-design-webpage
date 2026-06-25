// Home hero slideshow: crossfade through the stacked .s-hero__slide images.
// Progressive enhancement — the first slide is server-rendered .is-active, so
// no-JS and reduced-motion users always see a correct static hero. This module
// only adds the cycling. It waits for the first-visit intro curtain to clear
// before starting, so it never fights the curtain's GSAP tween on slide 0.

export function initHeroSlideshow() {
  const root = document.querySelector("[data-hero-slides]");
  if (!root) return; // not the home page

  // Reduced-motion: leave the static (server-rendered) active slide as-is.
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const slides = Array.from(root.querySelectorAll(".s-hero__slide"));
  if (slides.length < 2) return; // 0 or 1 image: nothing to cycle

  const hold = Number(root.dataset.heroInterval) || 6000;
  let i = slides.findIndex((s) => s.classList.contains("is-active"));
  if (i < 0) {
    i = 0;
    slides[0].classList.add("is-active");
  }

  // Decode the next image before fading to it, so the crossfade never reveals
  // a blank frame on a slow connection.
  const preload = (img) => {
    const src = img.currentSrc || img.src;
    if (!src) return Promise.resolve();
    const pre = new Image();
    pre.src = src;
    return pre.decode ? pre.decode().catch(() => {}) : Promise.resolve();
  };

  const advance = async () => {
    const next = (i + 1) % slides.length;
    await preload(slides[next]);
    slides[next].classList.add("is-active");
    slides[i].classList.remove("is-active");
    i = next;
  };

  let timer;
  const start = () => {
    if (!timer) timer = window.setInterval(advance, hold);
  };

  // Start only once the intro curtain is gone. intro.js animates and clears
  // inline props on slide 0 during the lift; starting before that could toggle
  // classes mid-animation. On repeat visits the curtain is already removed.
  const intro = document.querySelector("[data-intro]");
  if (!intro || !document.body.contains(intro)) {
    start();
  } else {
    const poll = window.setInterval(() => {
      if (!document.body.contains(intro)) {
        window.clearInterval(poll);
        start();
      }
    }, 200);
    // Backstop just past intro.js's 9s safety timeout, so we always start.
    window.setTimeout(() => {
      window.clearInterval(poll);
      start();
    }, 9500);
  }
}
