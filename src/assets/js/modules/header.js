// Header colour state: transparent over a hero, solid after scrolling past it.
export function initHeader() {
  const header = document.querySelector(".s-header");
  if (!header) return;
  const hero = document.querySelector("[data-hero]");

  // Pages with a dark hero start in "on-image" (white) mode.
  if (hero) header.dataset.state = "on-image";

  const threshold = () => (hero ? hero.offsetHeight - 80 : 40);
  const onScroll = () => {
    const past = window.scrollY >= threshold();
    header.classList.toggle("s-header--solid", past);
    if (hero) header.dataset.state = past ? "solid" : "on-image";
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
