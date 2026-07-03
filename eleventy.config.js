import Image from "@11ty/eleventy-img";
import path from "node:path";

// Resolve a public asset path (/assets/uploads/x.jpg) or a src-relative path
// to an on-disk path Eleventy Image can read at build time.
function toDiskPath(src) {
  if (src.startsWith("/assets/")) return path.join("src", src);
  if (src.startsWith("/")) return path.join("src", src);
  return src;
}

export default function (eleventyConfig) {
  // --- passthrough: ship authored assets as-is; Eleventy Image owns photos ---
  eleventyConfig.addPassthroughCopy({ "src/assets/css": "assets/css" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "assets/fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets/icons": "assets/icons" });
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("favicon-16x16.png");
  eleventyConfig.addPassthroughCopy("favicon-32x32.png");
  eleventyConfig.addPassthroughCopy("apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("android-chrome-192x192.png");
  eleventyConfig.addPassthroughCopy("android-chrome-512x512.png");
  eleventyConfig.addPassthroughCopy("site.webmanifest");

  eleventyConfig.addWatchTarget("src/assets/");

  // --- projects collection (lang-neutral entries; detail pages paginate per lang) ---
  eleventyConfig.addCollection("projects", (api) => {
    const projects = api
      .getFilteredByGlob("src/_projects/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));

    // Gallery layout is driven by each image's aspect ratio:
    //   vertical (3:4, 9:16) → half a row  → MUST come two-per-row
    //   horizontal (4:3, 16:9) → whole row → sits alone
    // We tag each image once (_wide + _rclass) and enforce the pairing rule:
    // a lone vertical fails the build. YAML 1.1 can fold "3:4" → 184
    // (sexagesimal), so we recover the canonical token defensively.
    const SEX = { 184: "3:4", 556: "9:16", 243: "4:3", 969: "16:9" };
    const HORIZ = new Set(["4:3", "16:9"]);
    const VERT = new Set(["3:4", "9:16"]);

    for (const p of projects) {
      const gallery = p.data.gallery || [];
      let run = 0; // length of the current unbroken vertical run
      let lastVertIdx = -1;
      const closeRun = () => {
        if (run % 2 !== 0) {
          const g = gallery[lastVertIdx];
          throw new Error(
            `Gallery layout error in ${p.inputPath}: vertical image ` +
              `"${g.image}" (item ${lastVertIdx + 1} of "${p.data.slug}") has ` +
              `no pair. Vertical images (3:4, 9:16) must sit two-per-row — add ` +
              `a second vertical beside it, or make one horizontal (4:3, 16:9).`,
          );
        }
        run = 0;
      };
      gallery.forEach((g, i) => {
        if (!g || !g.image) return closeRun(); // text block / empty → breaker
        let r = g.ratio;
        if (r == null) r = g.span === "full" ? "16:9" : "3:4"; // legacy span
        if (typeof r === "number") r = SEX[r] || String(r);
        g._wide = HORIZ.has(r);
        g._rclass = "is-r-" + String(r).replace(":", "-");
        if (VERT.has(r)) {
          run += 1;
          lastVertIdx = i;
        } else {
          closeRun(); // horizontal (or unknown) → full-width breaker
        }
      });
      closeRun();
    }

    return projects;
  });

  // --- i18n helpers (IT primary at /, EN under /en/) ---
  // counterpart URL of the current page in the other language
  eleventyConfig.addFilter("localeHref", (all, key, lang) => {
    const match = (all || []).find(
      (p) => p.data.translationKey === key && p.data.lang === lang,
    );
    return match ? match.url : lang === "it" ? "/" : "/en/";
  });
  // all language variants of a page (for <link rel="alternate" hreflang>)
  eleventyConfig.addFilter("localeAlternates", (all, key) =>
    (all || [])
      .filter((p) => p.data.translationKey === key)
      .map((p) => ({ lang: p.data.lang, url: p.url })),
  );
  // pick a per-language field: project.title_it / project.title_en via field("title", lang)
  eleventyConfig.addFilter("field", (obj, name, lang) =>
    obj ? obj[`${name}_${lang}`] : undefined,
  );
  // a project's cover = the first gallery item that has an image (gallery items
  // can be text-only). Returns undefined for an empty/image-less gallery.
  eleventyConfig.addFilter(
    "cover",
    (gallery) => (gallery || []).find((g) => g && g.image)?.image,
  );

  // --- Eleventy Image: responsive <picture> (AVIF/WebP/JPEG) ---
  async function imagePicture(src, alt = "", sizes = "100vw", attrs = {}) {
    if (!src) return "";
    const metadata = await Image(toDiskPath(src), {
      widths: [600, 1000, 1600, 2400],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./dist/assets/img/",
      urlPath: "/assets/img/",
    });
    const imageAttributes = {
      alt,
      sizes,
      loading: attrs.eager ? "eager" : "lazy",
      decoding: "async",
      ...(attrs.eager ? { fetchpriority: "high" } : {}),
      ...(attrs.class ? { class: attrs.class } : {}),
    };
    return Image.generateHTML(metadata, imageAttributes);
  }
  eleventyConfig.addAsyncShortcode("image", imagePicture);

  // build year for footer
  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
}
