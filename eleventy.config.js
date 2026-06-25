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
  eleventyConfig.addCollection("projects", (api) =>
    api
      .getFilteredByGlob("src/_projects/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0)),
  );

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
