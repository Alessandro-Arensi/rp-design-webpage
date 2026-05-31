# PIANA.DESIGN

Luxury architecture-studio website for Roberto Piana. Bilingual (IT primary / EN),
built with Eleventy, edited via Decap CMS, hosted on Netlify.

## Develop
- `make install` — install dependencies
- `make dev` — Eleventy dev server → http://localhost:8000
- `make cms` — local Decap CMS proxy (pair with `make dev`, open `/admin/`)

## Quality gates
- `make lint` — html-validate + stylelint + eslint
- `make a11y` — WCAG 2.1 AA audit (pa11y-ci: axe + HTML_CodeSniffer)
- `make links` — broken-link crawl
- `make build` — optimized production build into `dist/`

## Structure
- `src/_data/` — settings, nav, ui, contact, studio (per language)
- `src/_projects/` — one Markdown file per project (bilingual fields)
- `src/_includes/` — layouts + partials
- `src/it/`, `src/en/` — page routes (IT at `/`, EN under `/en/`)
- `src/assets/` — css, js (+ vendored gsap/lenis), fonts, icons, uploads

## Stack
Eleventy · Decap CMS (git-gateway + Netlify Identity) · GSAP + Lenis · Netlify.
See `PROJECT_ANALYSIS.md` for the full overview.
