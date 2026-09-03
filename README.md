# mddeck

> **Markdown-first slide decks with 3D transitions powered by
> [impress.js](https://github.com/impress/impress.js).**

`mddeck` is a toolchain for turning a Markdown file into an interactive
slide deck that animates in 3D when navigated. It's a spiritual cousin of
[Marp](https://marp.app/) — same Markdown syntax, same front-matter,
same directive system — but instead of building on [Bespoke.js](https://github.com/bespokejs/bespoke)
with flat slides, it builds on [impress.js](https://github.com/impress/impress.js)
for a Prezi-style 3D experience.

```markdown
---
theme: default
perspective: 1000
---

# Welcome to mddeck

A **markdown-first** slide deck engine that produces 3D presentations.

---

<!-- _position: { x: 1500, y: 0 } -->
<!-- _rotate: { z: 90 } -->

# Rotated

This slide is offset to the right and rotated 90° around the Z axis.

---

<!--
  _position: { x: 0, y: -1500, z: -2000 }
  _rotate: { x: -30, y: 20 }
  _scale: 2
-->

# Deep 3D

Scale 2×, X/Y rotation, deep Z position. Press `Esc` to return to the
overview view.
```

```bash
$ mddeck presentation.md -o slides.html
✓ presentation.md → slides.html
```

Open `slides.html` in any modern browser. Use arrow keys, spacebar, or
click to navigate.

---

## Features

- **Markdown-first authoring** — slides are plain `.md` files you can edit
  in any text editor
- **3D transitions** — every slide can be positioned and rotated in 3D
  space via simple front-matter directives
- **Self-contained output** — a single HTML file with CSS and JS inlined
- **PDF export** — headless Chromium converts the deck to a printable PDF
  (one page per slide)
- **Watch & live reload** — auto-rebuild on file changes for fast iteration
- **HTTP server** — serve the output directory for multi-device viewing
- **Themes** — six built-in themes (`default`, `gaia`, `uncover`,
  `impress`, `impress-flat`, `impress-bare`) plus support for custom CSS
- **Math** — KaTeX (default) or MathJax, server-side rendered
- **Emoji** — twemoji (Twitter-style SVG) for `:shortcode:` and unicode
- **XSS sanitization** — safe by default; inline HTML is filtered
- **VSCode extension** — live preview in the editor (available on the
  VS Code Marketplace as `mddeck-slides`)

---

## Repository layout

This is a monorepo using [Yarn workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/).

```
mddeck/
├── packages/
│   ├── core/                # @machine-w/mddeck-core — parser + theme + directives
│   │                         (the library that powers the CLI & VSCode)
│   ├── cli/                 # @machine-w/mddeck-cli — the `mddeck` command
│   └── vscode/              # mddeck-slides — VSCode extension (published)
├── examples/                # ready-made Markdown decks
└── tsconfig.base.json
```

### Packages

| Package | Status | Description |
|---|---|---|
| `@machine-w/mddeck-core` | ✅ v0.1.7 | The framework: Markdown → impress.js HTML + CSS |
| `@machine-w/mddeck-cli` | ✅ v0.1.7 | The `mddeck` CLI command (HTML / PDF / watch / server) |
| `mddeck-slides` (VSCode) | ✅ v0.1.7 | VSCode extension with live preview |

---

## Quick start

### 1. Install the CLI

```bash
npm install --save-dev @machine-w/mddeck-cli
# or
npx @machine-w/mddeck-cli --help
```

### 2. Write a deck

Create `presentation.md`:

```markdown
---
theme: default
---

# Slide 1

Your content here.

---

# Slide 2

More content.
```

### 3. Convert

```bash
# HTML (default)
mddeck presentation.md -o slides.html

# PDF
mddeck presentation.md --pdf -o slides.pdf

# Watch & serve for development
mddeck presentation.md --watch --server --port 8080
```

See [`packages/cli/README.md`](packages/cli/README.md) for the full CLI
reference.

---

## Using `@machine-w/mddeck-core` programmatically

If you want to integrate mddeck into your own tool (a build pipeline, a
static site generator, a server-side rendering service), use the library
directly:

```typescript
import { MdDeck } from '@machine-w/mddeck-core'

const deck = new MdDeck({
  theme: 'default',
  math: 'katex',
  perspective: 1000,
})

// Render to HTML + CSS separately (for embedding in a custom template)
const { html, css, comments } = deck.render('# Hello\n---\n# World')

// Or render a complete single-file document
const document = await deck.renderDocument({
  markdown: '# Hello\n---\n# World',
  title: 'My Deck',
  impressJsBundle: '<inline impress.js source>',
})
```

---

## Markdown syntax

### Front-matter

YAML at the top of the file (between `---` markers):

```yaml
---
theme: gaia
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
math: katex
---
```

### Slide separators

Three or more `-` characters on their own line:

```markdown
# Slide 1

---

# Slide 2
```

### Impress.js directives

HTML comments containing YAML:

```markdown
<!-- _position: { x: 1500, y: 0, z: 0 } -->
<!-- _rotate: { x: 0, y: 0, z: 90 } -->
<!-- _scale: 2 -->
```

Scoped directives (prefixed with `_`) apply to the current slide only;
non-scoped directives apply to the current slide **and all subsequent
slides** until overridden.

### Standard markdown

All standard markdown features are supported, plus:

| Feature | Syntax |
|---|---|
| Math (inline) | `$E = mc^2$` |
| Math (block) | `$$x^2 + y^2 = z^2$$` |
| Emoji shortcode | `:rocket:` |
| Emoji unicode | `🚀` |
| Code blocks | ` ```typescript ` |
| Tables | GFM-style |
| Strikethrough | `~~deleted~~` |
| Task lists | `- [x] done` |
| Footnotes | `text[^1]\n[^1]: footnote` |

See [`packages/cli/README.md`](packages/cli/README.md#slide-syntax) for the
full reference.

---

## Themes

Six themes ship with mddeck:

| Theme | Style |
|---|---|
| `default` | GitHub-flavored look, blue accent, left-aligned |
| `gaia` | Bold blue gradient, gold accents, centered content, shadowed h1 |
| `uncover` | Light gray background, magenta accent, centered headings, justified body, page-corner pagination |
| `impress` | White slide cards with 1px border, soft drop shadow, 10px radius, on a soft radial-gradient canvas (PT Sans / PT Serif) |
| `impress-flat` | Like `impress` but without the border or border-radius — card is borderless, still has the drop shadow |
| `impress-bare` | Like `impress-flat` but the slide itself is fully transparent — text floats directly on the canvas |

Switch via the front-matter `theme:` key, or pass `--theme` to the CLI.

Custom themes are just CSS files:

```css
/* my-theme.css */
:root {
  --mddeck-bg: #fafafa;
  --mddeck-fg: #2d3748;
  --mddeck-accent: #b83280;
}
.step { /* ... */ }
```

Use them with:

```bash
mddeck --theme ./my-theme.css presentation.md
```

---

## Browser support

mddeck uses modern browser features: CSS Custom Properties, CSS Grid,
`backdrop-filter`, `transform-style: preserve-3d`. All modern browsers
(Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) are supported.

For older browsers, impress.js falls back to a "not supported" message
that explains the requirement.

---

## Development

This is a Yarn workspaces monorepo. To set up a development environment:

```bash
git clone https://github.com/.../mddeck.git
cd mddeck
yarn install
yarn build
yarn test
```

### Running the example decks

```bash
# Build the basic example
node packages/cli/bin/mddeck.js examples/basic.md -o /tmp/basic.html

# Run the headless browser verification (requires playwright + chromium)
node examples/build-m2.mjs
```

### Project structure (internals)

```
packages/core/src/
├── mddeck.ts            # Main class
├── markdown/
│   ├── impress.ts       # Plugin: rewrites <section> → <div class="step">
│   ├── directives.ts    # Plugin: registers position/rotate/scale directives
│   ├── auto_layout.ts   # Plugin: 2D grid fallback for slides without position
│   ├── print_mode.ts    # Plugin: flatten 3D for PDF
│   └── marpit_plugin.ts # ESM/CJS bridge for @marp-team/marpit
├── postcss/
│   ├── step_replace.ts    # Rewrites `section` → `.step` in CSS
│   └── scaffold_inject.ts # Injects scaffold CSS at the end of the packed CSS
├── plugins_katex/         # KaTeX math plugin (lazy-loaded)
├── themes/                 # Built-in themes (default, gaia, uncover, scaffold)
├── html/                   # XSS sanitization (vendored from marp-core)
├── math/                   # Math framework (vendored from marp-core)
├── emoji/                  # twemoji plugin (vendored from marp-core)
├── slug/                   # heading-id plugin (vendored from marp-core)
├── size/                   # size directive plugin (vendored from marp-core)
└── auto-scaling/           # fitting-header / code-block scaling (vendored)
```

---

## Acknowledgements

- **[impress.js](https://github.com/impress/impress.js)** — the 3D slide
  engine that does all the heavy lifting in the browser
- **[Marp](https://marp.app/)** / **[marpit](https://marpit.marp.app/)** —
  the inspiration for the Markdown directive syntax
- **[marp-core](https://github.com/marp-team/marp-core)** — several
  markdown-it plugins (math, emoji, XSS sanitization, auto-scaling) are
  adapted from this project
- **[markdown-it](https://github.com/markdown-it/markdown-it)** — the
  underlying Markdown parser
- **[twemoji](https://github.com/twitter/twemoji)** — Twitter's emoji
  artwork

## License

MIT
