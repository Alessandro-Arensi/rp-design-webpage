// Header colour state: transparent over a hero, solid after scrolling past it.
export function initHeader() {
  const header = document.querySelector(".s-header");
  if (!header) return;
  const hero = document.querySelector("[data-hero]");

  // Pages with a dark hero start in "on-image" (white) mode.
  if (hero) header.dataset.state = "on-image";

  // Cache the threshold — reading hero.offsetHeight on every scroll forces a
  // layout. The hero is 100svh, so it only changes on resize.
  let threshold = hero ? hero.offsetHeight - 80 : 40;
  let solid;
  const onScroll = () => {
    const past = window.scrollY >= threshold;
    if (past === solid) return; // only touch the DOM when the state flips
    solid = past;
    header.classList.toggle("s-header--solid", past);
    if (hero) header.dataset.state = past ? "solid" : "on-image";
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  if (hero) {
    window.addEventListener(
      "resize",
      () => {
        threshold = hero.offsetHeight - 80;
        solid = undefined; // re-evaluate against the new threshold
        onScroll();
      },
      { passive: true },
    );
  }
}
