// Mobile navigation: full-screen overlay toggle.
export function initNav() {
  const toggle = document.querySelector(".s-header__toggle");
  const nav = document.querySelector(".s-header__nav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.classList.toggle("is-active", open);
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.documentElement.style.overflow = open ? "hidden" : "";
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
