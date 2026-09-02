# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`mddeck` is a Markdown-first slide deck engine that renders to **3D impress.js** presentations (Prezi-style) instead of flat slides. It is built on top of `@marp-team/marpit` — same Markdown syntax, same front-matter, but the output is `<div class="step">` with `data-x/y/z/rotate-*/scale` attributes consumed by impress.js instead of Marpit's `<section>`-based bespoke.js deck.

User-facing overview, theme catalog, and CLI option reference live in `README.md` and `packages/cli/README.md`. See `DEV.md` for the end-to-end manual cookbook (this file is the architecture companion, not the cookbook).

## Repository layout

Yarn-workspaces monorepo, `engines.node >= 18`. Three packages, all share the same version.

| Path | Package | Role |
|---|---|---|
| `packages/core/` | `@machine-w/mddeck-core` | Library: `MdDeck` class, plugin chain, themes |
| `packages/cli/` | `@machine-w/mddeck-cli` | `mddeck` CLI command (HTML/PDF/watch/server) |
| `packages/vscode/` | `mddeck-slides` | VS Code extension (preview/export/quick-pick) |

Build order during `yarn build`: **core → cli → vscode** (cli imports core; vscode extension bundles core via esbuild).

## Commands

```bash
# Setup
yarn install                              # install all workspaces (links them via file:../core)

# Build
yarn build                                # builds every package (tsc for core/cli, node scripts/build.mjs for vscode)
yarn workspace @machine-w/mddeck-core build
yarn workspace @machine-w/mddeck-cli build
cd packages/vscode && yarn build          # → packages/vscode/dist/extension.js (esbuild bundle)

# Test (vitest, per-package)
yarn test                                 # all packages
yarn workspace @machine-w/mddeck-core test          # 28+ tests (parser, directives, math, emoji, XSS)
yarn workspace @machine-w/mddeck-core test:watch   # watch mode for fast feedback
yarn workspace @machine-w/mddeck-cli test
yarn workspace mddeck-slides test                  # NB: the vscode package's npm name is 'mddeck-slides', not 'mddeck-vscode'

# Lint / format
yarn lint                                 # eslint "packages/*/src/**/*.ts"
yarn format                               # prettier --write

# Publish
yarn publish:all                          # bash scripts/publish.sh (core → cli → vsce)
```

### Run a single vitest file / test

```bash
yarn workspace @machine-w/mddeck-core test test/mddeck.test.ts
yarn workspace @machine-w/mddeck-core test -t "renders a single slide"   # pattern match
```

### Quick smoke test of the CLI without publishing

```bash
yarn workspace @machine-w/mddeck-core build
yarn workspace @machine-w/mddeck-cli build
node packages/cli/bin/mddeck.js examples/basic.md -o /tmp/basic.html
node packages/cli/bin/mddeck.js examples/basic.md --pdf -o /tmp/basic.pdf   # needs Chromium
```

The `bin/mddeck.js` shebang is just a 5-line wrapper that dynamic-imports `dist/mddeck-cli.js`. So CLI changes require `yarn workspace @machine-w/mddeck-cli build` before re-running.

## Architecture — the big picture

The pipeline flows: `Markdown → Marpit tokens (with custom directives applied) → mddeck markdown-it plugins (section → step rewrite + auto-layout) → PostCSS (section → .step selector rewrite + mddeck scaffold inject) → HTML+CSS bundle → host template (HTML doc w/ impress.js inline) → puppeteer-core (PDF only)`.

### `packages/core/src/mddeck.ts` — the `MdDeck` class

`MdDeck extends MarpitBase`. Constructor does, in order:

1. `super()` — runs Marpit's internal plugin install (this is why per-instance options live in `mddeckOptsByInstance` WeakMap; Marpit's `applyMarkdownItPlugins` fires inside `super()` before user property assignment).
2. `registerDirectives(this)` — registers `globalDirectives` (`width`, `height`, `perspective`, `transitionDuration`, `autoplay`, `pdfMode`, …) and `localDirectives` (`position`, `rotate`, `scale`, `stepTransitionDuration`, `relPosition`, `relTo`, …) onto the Marpit instance.
3. Loads built-in themes (`default`, `gaia`, `uncover`) via `themeSet.add()`, sets `themeSet.default`.
4. Installs `mddeckImpress`, `autoLayoutPlugin`, `printModePlugin` as markdown-it plugins.
5. Installs two **PostCSS** plugins (`step_replace`, `scaffold_inject`) that run during `themeSet.pack()` to coerce Marpit's `section { … }` selectors into `.step { … }` and append mddeck's own scaffold CSS.
6. Installs the vendored marp-core plugins (`html`, `emoji`, `math`, `auto-scaling`, `size`, `slug`) so they're available for renders even if Marpit's super()-time hook ran before user options were stored.

Public surface for consumers: `render(md, env)` / `renderAsString(md, env)` (return `{ html, css, comments }`) and `renderDocument({ markdown, title, impressJsBundle, extraCss, printable })` which wraps the rendered slides in a complete HTML document with impress.js inlined, an init script that sets `body.impress-ready`, and the `data-*` attributes on `<div id="impress">` (transition-duration, max/min-scale, perspective).

### `packages/core/src/markdown/` — markdown-it plugin chain

Order matters, see `index.ts` for the comment about why:

| Plugin | Stage | Job |
|---|---|---|
| (Marpit built-in) `marpit_slide` | core | wraps each slide in a `<section>` token |
| (Marpit built-in) `marpit_directives_apply` | core | reads front-matter & `<!-- _key: val -->` comments, populates `token.meta.marpitDirectives` |
| `mddeck_impress` (`impress.ts`) | core.after(directives_apply) | rewrites slide token: `tag='div'`, adds `class="step"`, `id="step-N"`, copies directive values to `data-x/y/z/rotate-*/scale/...` attributes (compound `position`/`rotate` objects get unpacked here) |
| `mddeck_auto_layout` (`auto_layout.ts`) | core.after(mddeck_impress) | assigns default 3D grid positions to steps missing `data-x/y/z` so they don't all stack at origin |

`print_mode.ts` injects flatten-the-3D CSS only when `opts.printable === true` (used by the PDF path).

The compound-vs-flat directive handling is in `impress.ts`: compound `position: { x, y, z }` → `data-x/y/z`; compound `rotate: { x, y, z, order }` → `data-rotate-x/y/z/order` (note: never `data-rotate`, which collides with the flat `rotate: 90` form). See `DIRECTIVE_TO_ATTR` and `ROTATE_OBJECT_MAP`.

`marpit_plugin.ts` is the ESM bridge that re-exports `@marp-team/marpit/plugin.js`'s `marpPlugin` factory — necessary because the upstream package's subpath has no `exports` entry and esbuild dynamic `require()` would fail in the packaged vsix.

### `packages/core/src/postcss/` — CSS pipeline

- `step_replace.ts` — PostCSS plugin that rewrites bare `section` selectors in the packed theme CSS into `.step`. Regex is anchored (`(^|[\s>+~])(section)(?=[\s.:#>+~[\],]|$)`) so it doesn't touch `.section`, `#section`, etc.
- `scaffold_inject.ts` — PostCSS plugin that appends `themes/scaffold.ts`'s CSS to the end of the packed stylesheet, after Marpit's own scaffold. The order matters: mddeck's scaffold wins as a consequence.

### `packages/core/src/themes/` — built-in themes

Three CSS-as-string themes (`default`, `gaia`, `uncover`) registered automatically. `scaffold.ts` is the mddeck-specific base layer (rules like `.step { width: …; height: …; }`, `--mddeck-*` CSS vars). Themes can be overridden by passing `--theme <file.css>` to the CLI or `themeSet.register()` programmatically.

### Vendored marp-core modules

`packages/core/src/{html,emoji,math,slug,size,auto-scaling}/` are lightly-adapted copies of `@marp-team/marp-core` modules. Don't refactor them to call back into marp-core — they were vendored deliberately to keep the dependency surface small and to allow mddeck-specific tweaks (e.g. emoji is forced to `twemoji`).

`html/allowlist.ts` + `html/html.ts` are the XSS sanitizer used as the default `markdown.set({ html })` config.

### `packages/cli/src/` — CLI shell

| File | Role |
|---|---|
| `mddeck-cli.ts` | yargs command definition + dispatch (`runFiles`, `runStdin`, `runWatch`, `runServer`). Watch uses `chokidar`; server uses `express` + `serve-index` over the output directory. |
| `converter.ts` | `Converter` class — wraps `MdDeck`, handles HTML (sync) and PDF (puppeteer-core + headless Chromium + wait for `body.impress-ready` + page.pdf) paths. Auto-detects Chromium via `PUPPETEER_EXECUTABLE_PATH` → `CHROME_PATH` → hard-coded list. |
| `templates/impress/layout.ts` | `renderImpressTemplate(deck, md, opts)` — produces the final HTML doc by calling `deck.renderDocument({ impressJsBundle: getImpressJsBundle(), … })`. |
| `impress-bundle.ts` | Loads the impress.js source bundled with the package (read from disk at build time and copied next to `dist/`). |
| `file.ts` | `File` class — wraps a path with `.content` and an `.outputPath(out, ext)` helper. |
| `config.ts` | Loads `mddeck.config.{js,ts,json,cjs,mjs}` via `cosmiconfig`; merges CLI args over file config. |

CLI is ESM (`"type": "module"`). PDF size parsed as `WIDTHxHEIGHT` (px) — the special strings `'16:9'` and `'4:3'` are accepted but currently fall through to `deck.sizeInfo`.

### `packages/vscode/src/` — VS Code extension

Bundled with **esbuild** (`packages/vscode/scripts/build.mjs`), NOT tsc — `dist/extension.js` is a single-file CJS bundle (with `import.meta.url` rewritten via esbuild `define` to `globalThis.importMetaURL`). The bundle ships `media/impress.js` and `media/icon.png` alongside.

| File | Role |
|---|---|
| `extension.ts` | `activate(context)` registers commands and a config-change listener that clears the theme cache. |
| `commands/preview.ts` | The interesting one. Renders markdown → HTML → writes to `os.tmpdir()/mddeck-preview-<sha1>/index.html`, starts a **loopback HTTP server** (`http.createServer.listen(0, '127.0.0.1', …)`), and opens the URL via `vscode.env.openExternal`. A debounced (250ms) `onDidChangeTextDocument` listener rewrites the file. The HTML has a 1-second polling script injected at the **last** `</html>` (using `lastIndexOf`, not `String.replace` — see the comment in `preview.ts:106-136`: `impress.js`'s source contains a stringified `</body></html>';` that any naive replace would splice into). |
| `commands/export.ts` | Renders to a file in workspace trust-gated mode; uses `markdown.mddeck.exportType` setting to pick html or pdf. |
| `themes.ts` | Workspace-trust-aware loader for `markdown.mddeck.themes` (custom CSS paths). Cached, cleared on config change. |
| `commands/index.ts` + the other 5 files | Quick-pick / new-file / settings / toggle-feature commands. |

Restricted configs (require workspace trust): `markdown.mddeck.html`, `markdown.mddeck.enableHtml`, `markdown.mddeck.themes`. The `untrustedWorkspaces` block in `package.json` declares these.

## Tests

Vitest. Each package has its own `vitest.config.ts` (no globals, node environment).

- Core (`packages/core/test/`): `mddeck.test.ts` (basic rendering, directives, frontmatter, auto-layout, themes), `m2.test.ts` (math, emoji, XSS, katex). Fixtures live in `packages/core/test/fixtures/`.
- CLI: `cli.test.ts` + fixtures in `test/fixtures/`.
- VSCode: `extension.test.ts` (directive + package.json sanity checks — the extension can't be exercised without the VS Code runtime).

Adding a new test: drop a `*.test.ts` file in the relevant `test/` directory. Vitest picks it up via the `test/**/*.test.ts` pattern.

## Gotchas / things that bite

- **The WeakMap dance**. `MdDeck` stores its options in `mddeckOptsByInstance` (WeakMap) and `mddeckPendingMathLibs`. Don't access user options via `this.opts`/`this._opts` inside `applyMarkdownItPlugins` overrides — by the time the override runs, Marpit's super() may not have called our `this.opt = ...` yet, so we look them up via the WeakMap instead. See the long comment in `mddeck.ts:72-110`.
- **katex is lazy-loaded**. `MdDeck.#loadMathLibIfNeeded()` does a dynamic `import('@machine-w/mddeck-core/plugins_katex/index.js')` (via the package's `exports` map) — never `require()`. If katex isn't installed, math falls back to escaped LaTeX and a `console.warn` fires; renders do NOT throw.
- **marpit deep import is fragile**. `packages/core/src/marpp_plugin.ts` and `packages/core/src/markdown/marpit_plugin.ts` both do `import ... from '@marp-team/marpit/plugin.js'`. That subpath is NOT in marpit's main exports — it only works because marpit has no `exports` field at all (legacy deep-import resolution). If a future marpit release adds an `exports` field without `./plugin`, both imports break simultaneously and every vendored plugin (math/emoji/slug/size/auto-scaling/katex) fails at first import. Remediation options are documented in the header comment of `marpit_plugin.ts` (file an upstream PR, vendor the 15-line `marpitPlugin` source, or use `createRequire`).
- **Step ID assignment**. `mddeck_impress` forces every step to `id="step-N"`. Don't try to preserve user-defined IDs through this plugin — they'll be overridden.
- **Compound `rotate` ≠ flat `rotate`**. `<!-- _rotate: { x: 0, y: 0, z: 90 } -->` → three `data-rotate-x/y/z` attrs. `<!-- _rotateZ: 90 -->` → one `data-rotate-z`. Mixing them on the same slide is fine but the impress.js engine reads them differently.
- **VSCode preview polling** uses byte-length comparison, not hashes, to avoid re-hashing on every poll. The `Cache-Control: no-store` header on the loopback server is also load-bearing.
- **CLI's esbuild-vsce path**. The published `@machine-w/mddeck-cli` package depends on `@machine-w/mddeck-core` via `file:../core` for monorepo dev — but that breaks at npm-publish time, so `scripts/publish.sh` temporarily swaps it to `^$VERSION` before publish and restores it after.
- **CI smoke tests** (`.github/workflows/ci.yml`) build both `/tmp/basic.html` and `/tmp/basic.pdf` with `PUPPETEER_EXECUTABLE_PATH: /usr/bin/chromium`. The lint job is a separate `lint:` job that runs `tsc --noEmit` on each `packages/*/tsconfig.json` (ESLint is declared in root `package.json` but not yet wired into CI per the comment at the bottom of `ci.yml`).

## Style / conventions in this repo

- TypeScript strict (`strict`, `strictNullChecks: true`, `noImplicitAny: false`), ESM (`"type": "module"` in core+cli), target ES2022.
- Prettier: semi-off, single quotes, trailing commas, printWidth 100. Enforced by `yarn format`.
- File header comments on every non-trivial file describing the *why* in a few lines — keep this style for new files.
- Three packages are versioned together (see `scripts/publish.sh:87-94` — it refuses to publish if versions diverge).
