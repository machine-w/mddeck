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

## [0.1.7] — 2026-09-03

### Added
- **Three new built-in themes** modeled on the [official impress.js demo](https://impress.js.org/):
  - `impress` — white slide cards with 1px border, soft drop shadow, 10px radius, on a radial-gradient canvas. Uses PT Sans for body and PT Serif for slide text.
  - `impress-flat` — same as `impress` but the slide's border, border-radius, and box-shadow are removed. The text is still in a white card, but the card is borderless.
  - `impress-bare` — same as `impress-flat` but the slide itself is fully transparent. The text floats directly on the canvas, with no card frame at all.
- **`examples/theme-impress.md`**, **`examples/theme-impress-flat.md`**, **`examples/theme-impress-bare.md`** — one example per new theme. `theme-impress-bare.md` is the most elaborate: 6 slides with 3D positions (`<!-- _position -->`), 3D rotations (`<!-- _rotate -->`), and decorative elements (rotated sidebar text, mirrored "Want to know more?" sticker, faded "H.SS" stamp, floating "transforms · transitions · CSS3" label, word-level `translateZ` for the 3D text effect).

### Fixed
- **Built-in themes' `.step` rules were being overridden by Marpit's scaffold.** Marpit emits a more-specific selector `div.marpit.mddeck > div.mddeck-slide-container > .step` (after `step_replace` rewrites `section` to `.step`), and its higher specificity was winning over the simple `.step` selectors in our theme CSS. New postcss plugin `scope_flatten.ts` collapses `div… .step .step` to a single `.step` so the slide stops requiring a non-existent nested step, and rewrites `:where(section):not([\\20 root])` to `.step` so the theme's CSS-variable definitions actually target the slide. Without this, only the first theme (default) was rendering correctly; `gaia`, `uncover`, and the three new impress themes all looked like default.
- **Scaffold was appended instead of prepended.** `scaffold_inject.ts` used `root.append(scaffoldCss)`, which placed the scaffold's `body { background: var(--mddeck-bg) }` and other rules AFTER every theme, so the scaffold's defaults overrode the theme's overrides (`--mddeck-bg: radial-gradient(...)` set by a theme would always be shadowed by the scaffold's `background: var(--mddeck-bg)` — which evaluated to the scaffold's own `--mddeck-bg`, not the theme's). Switched to `root.prepend(scaffoldCss)` so themes actually win.
- **VS Code preview didn't recognize the three new built-in themes.** `getMarpThemeSetFor()` had a hard-coded whitelist of the original three themes; without adding the new ones, previewing a markdown that used `theme: impress` would try to load an external theme file from `markdown.mddeck.themes` and silently fall back to default.
- **"Export Slide Deck..." command was missing the `mddeck: ` prefix** in its title. Added it so all 6 registered commands share a consistent prefix.

### Notes
- Public API unchanged. Consumers on `^0.1.5` resolve to `0.1.7` on next install; `^0.1.6` (and `^0.1.2`) also resolve to `0.1.7` since semver-major is still `0`.
- To use the new themes, just set `theme: impress` (or `impress-flat` / `impress-bare`) in the markdown front-matter. See `examples/theme-impress*.md` for the syntax.
- The impress.js 2.0.0 bundle's overview mode (`showOverview()` API from 1.x) was removed; the in-deck `Esc` key only triggers `exitFullscreen()`. A simple CSS-class-based overview shim (toggle on `Esc`, click a slide to exit) was prototyped but reverted in commit `7df9d0b` because the visual was too subtle to be worth the complexity. Open `impress().showStep(id)` from the browser console to jump to a specific slide if needed.

### Fixed
- **`mddeck --pdf` produced blank PDFs.** impress.js init applies
  transforms at four levels (`html`/`body` height, `#impress` scale,
  the anonymous centering wrapper, and `.step`'s own translate3d), and
  `PRINT_MODE_CSS` only reset the last one. The previous version of
  this fix landed in two pieces (the `ef7c94d` commit fixed the
  `transform` layers but missed the html/body sizing; the current
  commit finishes it). PDF now correctly produces one page per slide
  with each slide's content visible.
- **PDF slides looked tiny inside a 1920×1080 page.** Marpit's
  scaffold hardcodes `.step { width: 1280px; height: 720px }`, so
  the rendered slide design was pixel-perfect at 1280×720 but looked
  letterboxed inside the default 1920×1080 PDF page. `PRINT_MODE_CSS`
  now sets `.step { width: var(--pdf-w); height: var(--pdf-h); }`,
  scales the root `font-size` by `--pdf-scale` (so all `em`-sized
  headings/text scale proportionally), and centers the content with
  flexbox. Box-shadow is dropped in print (it was bleeding onto a
  trailing blank page after `transform: scale()` was tried).

### Internal
- `scripts/publish.sh` now registers a `trap 'rm -f .npmrc' EXIT` so
  the token-bearing `.npmrc` is removed on any exit path. Previously,
  if the script aborted mid-run, the rendered `.npmrc` lingered on
  disk (this was the bug that left the live token on disk during the
  0.1.4 → 0.1.5 publish).
- `packages/core/src/{marpp,marpit}_plugin.ts` header comments now
  document the `@marp-team/marpit/plugin.js` deep-import fragility:
  it works because marpit has no `exports` field. If marpit ever
  adds one without `./plugin`, every vendored plugin breaks at first
  import. Remediation options are spelled out in the file headers
  and mirrored in `CLAUDE.md` gotchas.
- `.github/releases/v0.1.5.md` saved for the eventual `gh release
  create` (gh CLI wasn't authenticated at the time of the 0.1.5
  release).

### Notes
- Public API is unchanged. Consumers on `^0.1.2` will resolve to
  0.1.6 on next install.
- If you upgrade from 0.1.4 directly: 0.1.4 was unpublished-blocked
  (npm granular tokens can't unpublish via 2FA) and has been deprecated
  on the registry. Go straight to 0.1.6.

### Fixed
- **`Cannot find module '…@marp-team/marpit/plugin.js'` when running
  `bin/mddeck.js` from an npm-installed `@machine-w/mddeck-cli`**
  (regression in 0.1.4). The vendored marpit plugin shims
  (`packages/core/src/markdown/marpit_plugin.ts` and
  `packages/core/src/marpp_plugin.ts`) used a hardcoded relative path
  that assumed a workspace install layout. Replaced with a normal
  `import '@marp-team/marpit/plugin.js'` so Node / esbuild resolve it
  the same way in any install context.
- **`ERR_PACKAGE_PATH_NOT_EXPORTED` from `require('@machine-w/mddeck-core')`**
  (regression in 0.1.4). The `exports["."]` map only declared `import`
  and `types` conditions, so CJS-style resolution fell through with no
  match. Added `default` (and re-ordered `types` first) so both ESM
  `import` and CJS `require` resolve to `dist/index.js`.

### Notes
- 0.1.4 was published with the same two bugs and could not be
  unpublished (npm granular tokens are blocked from unpublish by the
  registry's 2FA policy). 0.1.4 has been deprecated on npm with a
  pointer to 0.1.5.
- Public API is unchanged. Consumers on `^0.1.2` will resolve to 0.1.5
  on next install.

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

[Unreleased]: https://github.com/machine-w/mddeck/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/machine-w/mddeck/releases/tag/v0.1.6
[0.1.5]: https://github.com/machine-w/mddeck/releases/tag/v0.1.5
[0.1.4]: https://github.com/machine-w/mddeck/releases/tag/v0.1.4
[0.1.0]: https://github.com/machine-w/mddeck/releases/tag/v0.1.0
