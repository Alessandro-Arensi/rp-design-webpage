import Image from "@11ty/eleventy-img";
import sharp from "sharp";
import path from "node:path";

// Resolve a public asset path (/assets/uploads/x.jpg) or a src-relative path
// to an on-disk path Eleventy Image can read at build time.
function toDiskPath(src) {
  if (src.startsWith("/")) return path.join("src", src);
  return src;
}

export default function (eleventyConfig) {
  // --- passthrough: ship authored assets as-is; Eleventy Image owns photos ---
  eleventyConfig.addPassthroughCopy({ "src/assets/css": "assets/css" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "assets/fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets/icons": "assets/icons" });
  eleventyConfig.addPassthroughCopy({ "src/assets/uploads": "assets/uploads" });
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
  // Editors pick only an ORIENTATION per image (verticale / orizzontale). We read
  // the photo's real dimensions and snap it to the closest allowed ratio —
  //   verticale   → 3:4 or 9:16   (half a row; MUST come two-per-row)
  //   orizzontale → 4:3 or 16:9   (whole row; sits alone)
  // then tag each image (_wide + _rclass) and fail the build on a lone vertical.
  eleventyConfig.addCollection("projects", async (api) => {
    const projects = api
      .getFilteredByGlob("src/_projects/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));

    const CANDS = {
      orizzontale: [
        ["4:3", 4 / 3],
        ["16:9", 16 / 9],
      ],
      verticale: [
        ["3:4", 3 / 4],
        ["9:16", 9 / 16],
      ],
    };
    const SEX = { 184: "3:4", 556: "9:16", 243: "4:3", 969: "16:9" };

    // real width/height ratio of an upload, memoised per file
    const dims = new Map();
    const aspectOf = async (img) => {
      const disk = toDiskPath(img);
      if (dims.has(disk)) return dims.get(disk);
      let a = null;
      try {
        const m = await sharp(disk).metadata();
        if (m.width && m.height) a = m.width / m.height;
      } catch {
        a = null;
      }
      dims.set(disk, a);
      return a;
    };
    // orientation from the new field, with a fallback for legacy ratio/span data
    const orientationOf = (g) => {
      if (g.orientation) return g.orientation;
      const r = typeof g.ratio === "number" ? SEX[g.ratio] : g.ratio;
      if (r === "16:9" || r === "4:3") return "orizzontale";
      if (r === "3:4" || r === "9:16") return "verticale";
      return g.span === "full" ? "orizzontale" : "verticale";
    };
    // closest allowed ratio token within the chosen orientation
    const snap = (orient, aspect) => {
      const cands = CANDS[orient] || CANDS.verticale;
      if (aspect == null) return cands[0][0];
      let best = cands[0][0];
      let bestD = Infinity;
      for (const [tok, a] of cands) {
        const d = Math.abs(aspect - a);
        if (d < bestD) {
          bestD = d;
          best = tok;
        }
      }
      return best;
    };

    for (const p of projects) {
      // CMS no longer writes a slug field: the filename (already slugified
      // from the Italian title by Decap) doubles as the URL slug. Older
      // entries with an explicit front-matter slug keep it.
      if (!p.data.slug) p.data.slug = p.fileSlug;

      const gallery = p.data.gallery || [];
      let run = 0; // length of the current unbroken vertical run
      let lastVertIdx = -1;
      const closeRun = () => {
        if (run % 2 !== 0) {
          const g = gallery[lastVertIdx];
          throw new Error(
            `Gallery layout error in ${p.inputPath}: vertical image ` +
              `"${g.image}" (item ${lastVertIdx + 1} of "${p.data.slug}") has ` +
              `no pair. Verticale images sit two-per-row — add a second ` +
              `verticale beside it, or set one to Orizzontale.`,
          );
        }
        run = 0;
      };
      for (let i = 0; i < gallery.length; i++) {
        const g = gallery[i];
        if (!g || !g.image) {
          closeRun(); // text block / empty → full-width breaker
          continue;
        }
        const orient = orientationOf(g);
        const horiz = orient === "orizzontale";
        const token = snap(orient, await aspectOf(g.image));
        g._wide = horiz;
        g._rclass = "is-r-" + token.replace(":", "-");
        if (horiz) closeRun();
        else {
          run += 1;
          lastVertIdx = i;
        }
      }
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
