# =====================================================================
#  PIANA — build & tooling (Eleventy + Sveltia CMS, bilingual)
#  Reference : PROJECT_ANALYSIS.md, docs/superpowers/specs, .claude/plans
#  Usage     : `make` or `make help` lists every target.
# =====================================================================

# ---- config (override on CLI, e.g. `make dev PORT=3000`) ------------
PORT     ?= 8000
DIST     ?= dist
REPORTS  ?= reports
BIN      := ./node_modules/.bin
ELEVENTY := $(BIN)/eleventy

# open command: macOS `open`, else `xdg-open`
OPEN := $(shell command -v open >/dev/null 2>&1 && echo open || echo xdg-open)

.DEFAULT_GOAL := help
.PHONY: help install serve dev open cms lint lint-html lint-css lint-js \
        format format-check links audit a11y size build build-dev preview clean \
        deploy all ci

# ----------------------------------------------------------------- Help
help: ## Show this list of targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | sort \
	  | awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36m%-13s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------------- Setup
install: ## Install dependencies (npm install)
	npm install

node_modules: package.json
	npm install
	@touch node_modules

# ------------------------------------------------------------------ Dev
serve: dev ## Alias for `dev`

dev: node_modules ## Run the Eleventy dev server (watch + live reload) at :$(PORT)
	$(ELEVENTY) --serve --port $(PORT)

open: ## Open the running dev server in the browser
	$(OPEN) http://localhost:$(PORT)

cms: node_modules ## Run the local CMS proxy for /admin/ (pair with `make dev`)
	$(BIN)/decap-server

# -------------------------------------------------------------- Quality
lint: lint-html lint-css lint-js ## Run all linters (html, css, js)

lint-html: build-dev ## Validate the rendered HTML in $(DIST)
	$(BIN)/html-validate "$(DIST)/**/*.html"

lint-css: node_modules ## Lint the authored design-system CSS (base.css is vendored)
	$(BIN)/stylelint "src/assets/css/app.css"

lint-js: node_modules ## Lint the authored JS modules
	$(BIN)/eslint "src/assets/js/**/*.js"

format: node_modules ## Format with Prettier (writes)
	$(BIN)/prettier --write .

format-check: node_modules ## Check formatting without writing (CI-safe)
	$(BIN)/prettier --check .

links: build-dev ## Crawl the built site for broken links
	$(BIN)/linkinator "$(DIST)" --recurse --skip "node_modules|reports|piana\.design"

audit: build ## Lighthouse audit of the built site -> $(REPORTS)/lighthouse.html
	@mkdir -p $(REPORTS)
	@$(BIN)/browser-sync start --server "$(DIST)" --port $(PORT) --no-open & echo $$! > .bs.pid; \
	  sleep 2; \
	  $(BIN)/lighthouse http://localhost:$(PORT) --quiet \
	    --chrome-flags="--headless --no-sandbox" \
	    --output html --output-path $(REPORTS)/lighthouse.html; \
	  status=$$?; kill `cat .bs.pid` 2>/dev/null; rm -f .bs.pid; exit $$status

a11y: build-dev ## Accessibility audit (WCAG2AA via pa11y-ci) over the built site
	@python3 -m http.server $(PORT) --directory "$(DIST)" >/dev/null 2>&1 & echo $$! > .srv.pid; \
	  node -e 'setTimeout(()=>{}, 2000)'; \
	  $(BIN)/pa11y-ci --sitemap http://localhost:$(PORT)/sitemap.xml \
	    --sitemap-find "https://piana.design" --sitemap-replace "http://localhost:$(PORT)"; \
	  status=$$?; kill `cat .srv.pid` 2>/dev/null; rm -f .srv.pid; exit $$status

size: ## Report built asset sizes and flag images > 500 KB
	@echo "== $(DIST) size =="
	@du -sh "$(DIST)" 2>/dev/null || echo "  (run a build first)"
	@echo "== Images > 500 KB in $(DIST) =="
	@find "$(DIST)" -type f -size +500k \( -iname '*.jpg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.avif' \) -exec du -h {} + 2>/dev/null | sort -h || echo "  (none)"

# ---------------------------------------------------------------- Build
build: clean node_modules ## Build OPTIMIZED $(DIST)/ (Eleventy + minify css/js)
	@echo ">> Eleventy build (renders HTML + responsive images) ..."
	@$(ELEVENTY)
	@echo ">> Minifying CSS ..."
	@for f in $(DIST)/assets/css/*.css; do $(BIN)/cleancss -o "$$f" "$$f"; done
	@echo ">> Minifying JS modules ..."
	-@find $(DIST)/assets/js -name '*.js' -not -path '*/vendor/*' | while read f; do $(BIN)/terser "$$f" --compress --mangle --module -o "$$f" 2>/dev/null; done
	@echo ">> Optimizing SVG icons ..."
	-@$(BIN)/svgo -rqf $(DIST)/assets/icons >/dev/null 2>&1
	@echo ">> Optimized build complete -> $(DIST)/"

build-dev: clean node_modules ## Build UNMINIFIED $(DIST)/ (Eleventy only)
	@$(ELEVENTY) --quiet
	@echo ">> Dev build complete -> $(DIST)/"

preview: build ## Serve the built $(DIST)/ to verify the optimized build
	$(BIN)/browser-sync start --server "$(DIST)" --port $(PORT)

clean: ## Remove $(DIST)/ and $(REPORTS)/
	rm -rf $(DIST) $(REPORTS)

# --------------------------------------------------------------- Deploy
deploy: build ## (Fallback) publish $(DIST)/ to gh-pages — Netlify is primary
	$(BIN)/gh-pages -d $(DIST)

# ----------------------------------------------------------------- Meta
all: lint build ## Lint then build

ci: format-check lint build ## Non-mutating gate (format-check + lint + build)
