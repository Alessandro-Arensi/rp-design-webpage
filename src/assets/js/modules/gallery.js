// Project gallery lightbox, powered by PhotoSwipe v5. Click/tap a gallery image
// to open; PhotoSwipe supplies touch gestures (swipe nav, pinch-zoom + pan,
// double-tap zoom, swipe-down close) plus keyboard, focus trap and ARIA.
// PhotoSwipe is loaded lazily (dynamic import) on first open, so only project
// pages ever fetch it. No-op if the page has no triggers.
export function initGallery() {
  const triggers = Array.from(document.querySelectorAll(".g-trigger"));
  if (!triggers.length) return;

  // Full-size src + intrinsic dimensions are baked onto each trigger at build
  // time (the `pswp` shortcode). Fall back to the displayed image if missing.
  const items = triggers.map((t) => {
    const img = t.querySelector("img");
    return {
      src: t.dataset.pswpSrc || (img && (img.currentSrc || img.src)) || "",
      width: Number(t.dataset.pswpWidth) || (img && img.naturalWidth) || 0,
      height: Number(t.dataset.pswpHeight) || (img && img.naturalHeight) || 0,
      alt: (img && img.alt) || "",
    };
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let PhotoSwipe; // memoised after the first dynamic import

  async function open(index) {
    if (!PhotoSwipe) {
      ({ default: PhotoSwipe } = await import(
        "/assets/js/vendor/photoswipe.esm.min.js"
      ));
    }
    const lenis = window.__lenis;
    const pswp = new PhotoSwipe({
      dataSource: items,
      index,
      showHideAnimationType: reduce ? "fade" : "zoom",
      wheelToZoom: true,
      bgOpacity: 1,
    });
    // Pause Lenis so its smooth-scroll transform doesn't fight PhotoSwipe's own
    // scroll lock; resume when the viewer tears down. PhotoSwipe handles the
    // focus trap, focus-return, Esc and arrow keys itself.
    if (lenis) lenis.stop();
    pswp.on("destroy", () => {
      if (lenis) lenis.start();
    });
    pswp.init();
  }

  triggers.forEach((t, i) =>
    t.addEventListener("click", () => {
      open(i);
    }),
  );
}
