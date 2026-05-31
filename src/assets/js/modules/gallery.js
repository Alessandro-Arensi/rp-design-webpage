// Project gallery lightbox: open on click, ← → navigate, Esc close, focus trap.
// No-op if the page has no lightbox / triggers.
export function initGallery() {
  const lightbox = document.querySelector("[data-lightbox]");
  const triggers = Array.from(document.querySelectorAll(".g-trigger"));
  if (!lightbox || !triggers.length) return;

  const imgEl = lightbox.querySelector(".lightbox__img");
  const capEl = lightbox.querySelector(".lightbox__cap");
  const btnClose = lightbox.querySelector(".lightbox__close");
  const btnPrev = lightbox.querySelector(".lightbox__prev");
  const btnNext = lightbox.querySelector(".lightbox__next");
  let index = 0;
  let lastFocused = null;

  const items = triggers.map((t) => {
    const img = t.querySelector("img");
    return {
      src: (img && (img.currentSrc || img.src)) || "",
      alt: (img && img.alt) || "",
      cap: t.dataset.caption || "",
    };
  });

  function show(i) {
    index = (i + items.length) % items.length;
    const it = items[index];
    imgEl.src = it.src;
    imgEl.alt = it.alt;
    capEl.textContent = it.cap;
    capEl.hidden = !it.cap;
  }
  function open(i) {
    lastFocused = document.activeElement;
    show(i);
    lightbox.hidden = false;
    document.documentElement.style.overflow = "hidden";
    if (window.__lenis) window.__lenis.stop();
    btnClose.focus();
  }
  function close() {
    lightbox.hidden = true;
    document.documentElement.style.overflow = "";
    if (window.__lenis) window.__lenis.start();
    if (lastFocused) lastFocused.focus();
  }

  triggers.forEach((t, i) => t.addEventListener("click", () => open(i)));
  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", () => show(index - 1));
  btnNext.addEventListener("click", () => show(index + 1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "Tab") {
      const f = [btnPrev, btnNext, btnClose];
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
