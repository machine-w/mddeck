# Changelog

All notable changes to **mddeck** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Conventions**:
> - **Added** for new features.
> - **Changed** for changes in existing functionality.
> - **Deprecated** for soon-to-be-removed features.
> - **Removed** for now-removed features.
> - **Fixed** for any bug fixes.
> - **Security** for vulnerability fixes.

---

## [Unreleased]

### Planned
- Full `mathjax` integration (currently requires user to install `@mathjax/src` and register the plugin manually)
- `serve-index` improvements: custom 404 page, better `index.html` rendering
- LSP-style completion for mddeck directives in VSCode
- Server mode: support multiple input files with auto-rebuild

---

## [0.1.4] — 2026-09-02

### Fixed
- **`yarn install` failed in fresh checkouts** with `Package "" refers to a
  non-existing file '"/Users/machine/myworkspace/core"'`. Three underlying
  causes were addressed:
  - Root `package.json` no longer pins a stale dev-dependency on the
    published `@machine-w/mddeck-cli` that pointed yarn at a broken
    release artifact. Root now only declares its own tooling
    (eslint/prettier/vitest).
  - Stray `package-lock.json` (from npm) removed; this is a yarn
    project and `yarn.lock` is the source of truth.
- **CLI runtime error `Cannot find module '…@marp-team/marpit/plugin.js'`**
  when running `bin/mddeck.js`. The vendored marpit plugin shims
  (`packages/core/src/markdown/marpit_plugin.ts` and
  `packages/core/src/marpp_plugin.ts`) had relative paths to the
  hoisted root `node_modules` that were each one `..` short.

### Notes
- No public API changes. Consumers who pin `@machine-w/mddeck-cli`
  `^0.1.2` will see this as `0.1.4` on the next install but the runtime
  behavior is unchanged from a working 0.1.2 install.

---

## [0.1.0] — 2026-08-30

🎉 **First public release.**

`mddeck` is a toolchain for turning a Markdown file into an interactive
slide deck that animates in 3D when navigated. It's a spiritual cousin of
[Marp](https://marp.app/) with the same Markdown syntax, but instead of
[Bespoke.js](https://github.com/bespokejs/bespoke) it uses
[impress.js](https://github.com/impress/impress.js) for a Prezi-style
3D experience.

### Added

#### `@machine-w/mddeck-core` (the library)
- **`MdDeck` class** extending Marpit with the impress.js output template
- **impress.js integration plugin** (`mddeck_impress`): rewrites Marpit's
  default `<section>` tokens into `<div class="step" id="step-N" data-x=…>`
  with all required `data-*` attributes
- **3D positioning directives** (in HTML comments or front-matter):
  - `position: { x, y, z }` — 3D position
  - `rotate: { x, y, z, order }` — 3D rotation
  - `scale: number` — scale factor
  - `stepTransitionDuration: number` — per-slide transition
  - `rel-position`, `rel-to` — relative positioning (delegated to
    impress.js's `rel` plugin)
- **Canvas configuration** (front-matter): `theme`, `width`, `height`,
  `perspective`, `maxScale`, `minScale`, `transitionDuration`,
  `autoplay`, `math`, `headingDivider`, `pdfMode`
- **Auto-layout plugin** (`mddeck_auto_layout`): arranges slides without
  explicit positions in a 2D grid (4 columns wide)
- **Print-mode plugin** (`mddeck_print_mode`): injects CSS that flattens
  the 3D perspective for PDF export
- **PostCSS pipeline**:
  - `step_replace` — rewrites `section` → `.step` in CSS selectors
  - `scaffold_inject` — appends the mddeck scaffold CSS (variables,
    `.step` base styles, fallback-message hide rule)
- **3 built-in themes**: `default` (GitHub-flavored), `gaia` (blue
  gradient), `uncover` (academic)
- **Self-contained `renderDocument()`** method that produces a complete
  single-file HTML deck (with inlined impress.js runtime and init script
  that adds `body.impress-ready` on init)
- **28 unit tests** covering slide rendering, directives, auto-layout,
  theme registration

#### Math, emoji, XSS, and markdown extensions (vendored from marp-core)
- **Math framework** (`$...$` inline, `$$...$$` block) — tokenizes math
  expressions; the renderer is pluggable
- **KaTeX plugin** (`@machine-w/mddeck-core/katex`) — synchronous math rendering;
  installed lazily on first render to avoid forcing katex on users who
  don't need math
- **HTML sanitization** (XSS) using [xss](https://github.com/leizongmin/js-xss)
  with marp's default allowlist — strips `<script>`, `onerror=`,
  `javascript:` URLs
- **Emoji** via [twemoji](https://github.com/twitter/twemoji): supports
  both `:shortcode:` and unicode emoji, rendered as colored SVG
- **Heading slug** plugin (github-slugger) — auto-generates `id` for
  headings
- **Size directive** — `size: 16:9` / `size: 4:3` in front-matter
- **Auto-scaling** — `<!-- fit -->` headings and code blocks scale to fit
  the slide

#### `@machine-w/mddeck-cli` (the command-line tool)
- **`mddeck <input.md> [-o <output>]`** — convert Markdown to HTML
- **`--pdf`** — convert to PDF using headless Chromium via puppeteer-core
- **`--watch` / `-w`** — auto-rebuild on file changes
- **`--server` / `-s`** — serve the output directory over HTTP
- **`--stdin`** — read Markdown from stdin
- **`--theme`** — built-in theme name or path to custom CSS file
- **`--math {katex|mathjax|false}`** — choose math engine
- **`--pdf-size`** — PDF page dimensions (default `1920x1080`)
- **`--browser`** — path to Chromium for PDF
- **`mddeck.config.js`** support via cosmiconfig
- **7 unit tests** for file I/O, config loading, output path computation

#### `mddeck-vscode` (the VS Code extension)
- **Live preview** — `extendMarkdownIt` hook that swaps the markdown-it
  renderer for `@machine-w/mddeck-core` when the file has a `theme:` front-matter
- **Export command** (`mddeck: Export Slide Deck…`) — shells out to
  `@machine-w/mddeck-cli` to produce HTML or PDF
- **New file command** (`mddeck: New mddeck Markdown File`) — creates a
  template `.md` file
- **Toggle command** (`mddeck: Toggle mddeck feature in current Markdown`)
  — flips `mddeck: true/false` in the front-matter
- **Quick pick** (`mddeck: Show All Commands…`) — VS Code palette
  shortcut
- **Configuration** under `markdown.mddeck.*` (breaks, html, math,
  themes, exportType, exportAutoOpen)
- **6 unit tests** verifying directive definitions and package.json
  schema

#### Documentation
- `README.md` (348 lines) — project overview, features, quick start
- `DEV.md` (425 lines) — development & testing guide
- `PUBLISH.md` (526 lines) — release & publishing guide
- `packages/core/README.md` (194 lines) — library API reference
- `packages/cli/README.md` (631 lines) — CLI reference (install, commands,
  options, configuration, slide syntax, troubleshooting)
- `examples/README.md` (122 lines) — example decks
- Chinese translations: `README_CN.md`, `DEV_CN.md`, `PUBLISH_CN.md`,
  and per-package `README_CN.md`

### Notes

- **Test status**: 41 tests pass (28 core + 7 CLI + 6 VSCode)
- **Browser-verified**: M1 (impress.js 3D rendering), M2 (twemoji +
  XSS sanitization), M2.5 (KaTeX math) — all confirmed via headless
  Chromium screenshots in `examples/screenshots*/`
- **Known limitations**:
  - `mathjax` is not bundled (heavy peer-deps); users who want it
    should install `@mathjax/src` and register the plugin manually
  - The VSCode extension preview replaces the entire markdown-it
    output (not a markdown-it plugin chain), so it doesn't compose
    with other VSCode markdown extensions
  - `renderAsString()` and `renderDocument()` are now `async` (returns
    Promise) when `math: 'katex'` is set, since katex is loaded
    asynchronously

[Unreleased]: https://github.com/machine-w/mddeck/compare/v0.1.4...HEAD
[0.1.4]: https://github.com/machine-w/mddeck/releases/tag/v0.1.4
[0.1.0]: https://github.com/machine-w/mddeck/releases/tag/v0.1.0
