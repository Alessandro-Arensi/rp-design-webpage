// Lenis smooth scroll (site-wide). Disabled under reduced-motion -> native scroll.
// Loaded as a global (window.Lenis) from /assets/js/vendor/lenis.min.js.
export function initLenis() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.Lenis) return null;

  const lenis = new window.Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Let same-page anchor links use Lenis.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target);
        }
      }
    });
  });

  window.__lenis = lenis;
  return lenis;
}
