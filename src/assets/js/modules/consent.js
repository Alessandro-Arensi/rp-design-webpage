// Cookie consent (Garante 2021). The banner shows while html.consent-ask is set
// (armed in <head> from the same stored record). The choice lives in localStorage
// and expires after consentMaxDays, or when consentVersion is bumped (e.g. after a
// policy change). Third-party tags from site.tracking load only once consented:
// Google tag (with Consent Mode v2 signals) for analytics or marketing, Meta Pixel
// for marketing. A loaded tag can't be unloaded, so revoking drops its cookies and
// reloads the page clean.

const KEY = "piana_consent";
const DAY = 864e5;
const TRACKER_COOKIES = /^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/;

export function initConsent() {
  const root = document.querySelector("[data-consent]");
  if (!root) return;

  const html = document.documentElement;
  const dialog = root.querySelector("[data-consent-dialog]");
  const switches = root.querySelectorAll("[data-consent-cat]");
  const version = Number(root.dataset.version);
  const maxAge = Number(root.dataset.maxDays) * DAY;
  const googleIds = root.dataset.google ? root.dataset.google.split(",") : [];
  const metaId = root.dataset.meta;

  const read = () => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY));
      if (c && c.v === version && Date.now() - c.ts < maxAge) return c;
    } catch {
      /* blocked storage: ask every visit */
    }
    return null;
  };

  let current = read();
  let googleLoaded = false;
  let metaLoaded = false;

  const addScript = (src) => {
    const s = document.createElement("script");
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  };

  const loadTrackers = (c) => {
    const state = (on) => (on ? "granted" : "denied");
    const signals = {
      analytics_storage: state(c.analytics),
      ad_storage: state(c.marketing),
      ad_user_data: state(c.marketing),
      ad_personalization: state(c.marketing),
    };
    if (googleLoaded) {
      window.gtag("consent", "update", signals);
    } else if (googleIds.length && (c.analytics || c.marketing)) {
      googleLoaded = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        // gtag.js expects the arguments object itself, not an array
        window.dataLayer.push(arguments);
      };
      window.gtag("consent", "default", signals);
      window.gtag("js", new Date());
      googleIds.forEach((id) => window.gtag("config", id));
      addScript(
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleIds[0])}`,
      );
    }
    if (metaId && c.marketing && !metaLoaded) {
      metaLoaded = true;
      // Meta's standard stub: queues calls until fbevents.js arrives.
      const fbq = function () {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
        else fbq.queue.push(arguments);
      };
      Object.assign(fbq, {
        push: fbq,
        loaded: true,
        version: "2.0",
        queue: [],
      });
      window.fbq = fbq;
      if (!window._fbq) window._fbq = fbq;
      addScript("https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", metaId);
      fbq("track", "PageView");
    }
  };

  // Expire tracker cookies on the host and on the bare domain (where _ga sits).
  const clearTrackerCookies = () => {
    const host = location.hostname;
    const domains = ["", host, `.${host.replace(/^www\./, "")}`];
    document.cookie.split(";").forEach((pair) => {
      const name = pair.split("=")[0].trim();
      if (!TRACKER_COOKIES.test(name)) return;
      domains.forEach((d) => {
        document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
      });
    });
  };

  const save = (analytics, marketing) => {
    const prev = current;
    current = { v: version, ts: Date.now(), analytics, marketing };
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* not persisted: the banner returns next visit */
    }
    html.classList.remove("consent-ask");
    if (dialog.open) dialog.close();
    const revoked =
      prev &&
      ((prev.analytics && !analytics) || (prev.marketing && !marketing));
    if (revoked && (googleLoaded || metaLoaded)) {
      clearTrackerCookies();
      location.reload();
      return;
    }
    loadTrackers(current);
  };

  const openDialog = () => {
    switches.forEach((s) => {
      s.checked = Boolean(current && current[s.dataset.consentCat]);
    });
    dialog.showModal();
  };

  // Delegated: the footer's "Cookie preferences" button sits outside the root.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-consent-action]");
    if (!btn) return;
    const action = btn.dataset.consentAction;
    if (action === "accept") save(true, true);
    else if (action === "reject") save(false, false);
    else if (action === "customize") openDialog();
    else if (action === "dismiss") dialog.close();
    else if (action === "save") {
      const on = (cat) =>
        root.querySelector(`[data-consent-cat="${cat}"]`).checked;
      save(on("analytics"), on("marketing"));
    }
  });

  if (current) loadTrackers(current);
}
