// Mobile navigation: full-screen overlay toggle.
export function initNav() {
  const toggle = document.querySelector(".s-header__toggle");
  const nav = document.querySelector(".s-header__nav");
  const header = document.querySelector(".s-header");
  if (!toggle || !nav) return;

  let restoreTimer;
  const setOpen = (open) => {
    toggle.classList.toggle("is-active", open);
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!header) return;
    // The header's backdrop-filter makes it a containing block for the
    // fixed full-screen overlay. Drop it while open; on close, keep it off
    // until the slide-up finishes so the overlay doesn't snap mid-animation.
    window.clearTimeout(restoreTimer);
    if (open) {
      header.classList.add("is-nav-open");
    } else {
      restoreTimer = window.setTimeout(
        () => header.classList.remove("is-nav-open"),
        850,
      );
    }
  };

  toggle.addEventListener("click", () =>
    setOpen(!nav.classList.contains("is-open")),
  );
  nav
    .querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}
