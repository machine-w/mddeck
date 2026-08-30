# @mddeck/cli

> Convert Markdown to 3D slide decks powered by [impress.js](https://github.com/impress/impress.js).

The `mddeck` CLI is the easiest way to turn a Markdown file into a single-file
impress.js HTML presentation, or a printable PDF.

```bash
$ mddeck presentation.md -o slides.html
✓ presentation.md → slides.html
```

Open `slides.html` in any modern browser and use the arrow keys, spacebar,
or click to navigate the deck. Each slide can be positioned and rotated in 3D
space via simple front-matter directives (see [Slide syntax](#slide-syntax)
below).

---

## Table of contents

1. [Installation](#installation)
2. [Quick start](#quick-start)
3. [Commands](#commands)
   - [`mddeck <files...>` — convert to HTML](#convert)
   - [`--pdf` — convert to PDF](#pdf)
   - [`--watch` / `-w` — auto-rebuild on change](#watch)
   - [`--server` / `-s` — serve over HTTP](#server)
   - [`--stdin` — read Markdown from stdin](#stdin)
4. [Options](#options)
5. [Configuration](#configuration)
6. [Slide syntax](#slide-syntax)
   - [Front-matter](#front-matter)
   - [Slide separators](#slide-separators)
   - [Impress.js directives](#impressjs-directives)
   - [Markdown features](#markdown-features)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

---

## Installation

```bash
# Local install (recommended for projects)
npm install --save-dev @mddeck/cli

# Or one-off via npx
npx @mddeck/cli presentation.md
```

### Optional dependencies

| Feature | Required package | Why |
|---|---|---|
| **PDF output** | `puppeteer-core` + a Chromium binary | Headless browser for PDF rendering |
| **KaTeX math** | `katex` | Fast synchronous LaTeX rendering |
| **MathJax math** | `@mathjax/src` + several font-extension packages | Slower but more comprehensive LaTeX support |

The CLI will print a clear warning if any required dependency is missing —
it never silently fails.

For PDF support, install Chromium or set `PUPPETEER_EXECUTABLE_PATH` /
`CHROME_PATH` to your existing Chrome/Edge/Firefox binary. The CLI also
auto-detects the following paths:

```
/usr/bin/chromium
/usr/bin/chromium-browser
/usr/bin/google-chrome
/usr/bin/google-chrome-stable
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
/Applications/Chromium.app/Contents/MacOS/Chromium
```

---

## Quick start

1. **Create a Markdown file** with a front-matter block and slide separators:

   ```markdown
   ---
   theme: gaia
   ---

   # First slide

   Hello, world!

   ---

   <!-- _position: { x: 1500, y: 0 } -->

   # Second slide

   Offset to the right in 3D.
   ```

2. **Convert to HTML**:

   ```bash
   mddeck presentation.md -o slides.html
   ```

3. **Open `slides.html` in a browser**. Use arrow keys / space / click to
   advance through the deck. The 3D transitions between slides are rendered
   by impress.js.

4. **(Optional) Export to PDF** for handouts or printing:

   ```bash
   mddeck presentation.md --pdf -o slides.pdf
   ```

   PDF output flattens the 3D layout — each slide becomes its own page.

---

## Commands

### `mddeck <files...>` — convert to HTML

Convert one or more Markdown files to single-file HTML decks.

```bash
# Basic conversion (output filename derived from input)
mddeck presentation.md

# Explicit output path
mddeck presentation.md -o /tmp/deck.html

# Multiple files in one run
mddeck slides/*.md -o output/
```

The output is a fully self-contained HTML file with inlined CSS, slide HTML,
and the impress.js runtime. No build step, no asset folder — just open the
file in a browser.

### `--pdf` — convert to PDF

Generate a printable PDF using headless Chromium via `puppeteer-core`.

```bash
mddeck presentation.md --pdf -o slides.pdf
```

How it works:

1. The Markdown is rendered to a self-contained HTML document (same as the
   normal HTML path).
2. The HTML is loaded into a headless Chromium page.
3. The CLI waits for the `body.impress-ready` class to be set by impress.js
   (meaning `impress().init()` has run and all step transforms have been
   computed).
4. A print-mode CSS override is injected that flattens the 3D perspective
   and disables transitions, so each step renders as its own page.
5. `page.pdf()` is called with the requested page size.

Default page size is **1920×1080** (16:9). Override with `--pdf-size`:

```bash
mddeck presentation.md --pdf --pdf-size 1280x720 -o slides.pdf
```

> **Tip**: For the highest-quality PDF, render the HTML in a normal browser
> first and use the browser's "Print → Save as PDF" — Chromium's print
> rendering tends to produce more accurate text rendering than the CLI's
> screenshot-based pipeline for complex layouts.

### `--watch` / `-w` — auto-rebuild on change

Continuously rebuild the output when any of the input files change.

```bash
mddeck presentation.md --watch -o slides.html
# 👀 Watching presentation.md
# ✓ presentation.md → slides.html
# (waiting for changes...)
```

Press `Ctrl+C` to stop. Combined with `--server` (below) you get a live-reload
development workflow.

### `--server` / `-s` — serve over HTTP

Serve the output directory over HTTP so multiple people (or browsers on
different machines) can view the deck.

```bash
mddeck presentation.md --server --port 8080
# 🚀 mddeck server: http://localhost:8080/
#    Serving: /your/cwd
```

Open `http://localhost:8080/` in a browser — you'll see the directory listing
with the generated HTML file. Combine with `--watch` for live updates:

```bash
mddeck presentation.md --watch --server --port 8080
```

Press `Ctrl+C` to stop.

### `--stdin` — read Markdown from stdin

Pipe Markdown from another program:

```bash
# From echo / heredoc
echo '# Hello\n\n---\n# World' | mddeck --stdin -o deck.html

# From another tool (e.g. pandoc, a static site generator)
pandoc README.md -t markdown | mddeck --stdin --pdf -o deck.pdf
```

---

## Options

| Option | Alias | Default | Description |
|---|---|---|---|
| `--output` | `-o` | (derived from input filename) | Output file or directory path |
| `--pdf` | | `false` | Generate PDF instead of HTML (requires puppeteer-core) |
| `--pdf-size` | | `1920x1080` | PDF page size (e.g. `1280x720`, `A4`) |
| `--theme` | | `default` | Theme name (`default` / `gaia` / `uncover`) or path to a `.css` file |
| `--math` | | `katex` (if installed) | Math engine: `katex`, `mathjax`, or `false` |
| `--watch` | `-w` | `false` | Watch input files and rebuild on change |
| `--server` | `-s` | `false` | Serve the output directory over HTTP |
| `--port` | | `8080` | Port for `--server` mode |
| `--browser` | | (auto-detect) | Path to a Chromium executable (for PDF) |
| `--stdin` | | `false` | Read Markdown from stdin instead of files |
| `--config` | `-c` | (auto-discover) | Path to a `mddeck.config.js` file |
| `--help` | `-h` | | Show the help message and exit |
| `--version` | `-v` | | Show the CLI version and exit |

### Environment variables

| Variable | Description |
|---|---|
| `PUPPETEER_EXECUTABLE_PATH` | Override path to Chromium for PDF generation |
| `CHROME_PATH` | Alternative to `PUPPETEER_EXECUTABLE_PATH` |
| `DEBUG` | Enable debug logging (`mddeck-cli:*` namespace) |

---

## Configuration

For project-wide defaults, create a `mddeck.config.js` (or `.mjs` / `.cjs` /
`.ts` / `.json`) in your project root:

```js
// mddeck.config.js

/** @type {import('@mddeck/core').MdDeckOptions} */
const mddeck = {
  theme: 'gaia',
  math: 'katex',
  perspective: 1200,
}

module.exports = {
  mddeck,
  // (other top-level keys: output, watch, server, allowLocalFiles)
}
```

Configuration sources (in order of precedence — later wins):

1. Built-in defaults
2. `mddeck.config.js` (or `.cjs` / `.mjs` / `.ts` / `.json`)
3. `.mddeckrc` (JSON only)
4. The `mddeck` key in `package.json`
5. Command-line flags

> **CLI flags always win** over the config file. Use the config file for
> project-wide defaults, and the CLI for one-off overrides.

### Config file schema

```ts
interface MdDeckConfig {
  /** Default options passed to every deck */
  mddeck?: MdDeckOptions
  /** Output directory or file (relative to project root) */
  output?: string
  /** Enable watch mode by default */
  watch?: boolean
  /** Enable server mode by default (or specify port) */
  server?: boolean | number
  /** Allow loading local files from HTML (images, fonts, etc.) */
  allowLocalFiles?: boolean
  /** Theme name or path to a CSS file */
  theme?: string
}
```

---

## Slide syntax

`mddeck` slides are plain Markdown files. Two extra pieces of syntax are
added on top:

1. **Front-matter** at the top of the file (between `---` markers)
2. **HTML comments** containing YAML directives anywhere in the file

Both follow the same syntax as [marp](https://marp.app/).

### Front-matter

```markdown
---
theme: gaia
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
math: katex
---
```

The supported front-matter keys are:

| Key | Type | Default | Description |
|---|---|---|---|
| `theme` | string | `default` | Theme name (`default`, `gaia`, `uncover`) or path to a CSS file |
| `width` / `height` | number | `1920` / `1080` | Canvas dimensions in pixels |
| `perspective` | number | `1000` | CSS perspective value. `0` disables 3D (slides become flat) |
| `maxScale` / `minScale` | number | `3` / `0` | impress.js zoom limits |
| `transitionDuration` | number | `1000` | Transition duration in milliseconds |
| `autoplay` | number | — | Auto-advance after N seconds (passes through to impress.js) |
| `math` | string | `katex` (if installed) | Math engine: `katex`, `mathjax`, or `false` |

### Slide separators

Use `---` on its own line to split the deck into slides. Three or more `-`
characters with optional surrounding whitespace work — the rules are the
same as [CommonMark thematic breaks](https://spec.commonmark.org/0.31.2/#thematic-breaks).

```markdown
# Slide 1

Some content.

---

# Slide 2

More content.

---

# Slide 3
```

If you prefer to split on headings instead of `---`, set
`headingDivider: 1` (or 2, 3, …) in the front-matter to start a new slide
above every heading of that level or deeper.

### Impress.js directives

The 3D position, rotation, and scale of each slide is controlled by **HTML
comments** placed anywhere in the slide (typically right above the
heading). The comments use YAML syntax inside an HTML comment block.

#### Global directives (apply to whole deck)

Set in the front-matter only.

#### Local directives (apply to current and following slides)

```markdown
<!-- position: { x: 1500, y: 0, z: 0 } -->
<!-- rotate: { x: 0, y: 0, z: 45, order: "xyz" } -->
<!-- scale: 1 -->
<!-- transitionDuration: 800 -->
```

#### Scoped local directives (apply to current slide only)

Prefix the directive name with an underscore (`_`). These take effect for
only the slide they appear in; subsequent slides inherit the previous
"non-scoped" value.

```markdown
<!-- _position: { x: 0, y: -1500 } -->
<!-- _rotate: { z: 90 } -->
<!-- _scale: 2 -->

# This slide is offset upward, rotated 90°, and scaled 2x
```

The supported directives are:

| Directive | Type | Description | impress.js attribute |
|---|---|---|---|
| `position` | `{x, y, z}` | 3D position of the slide center | `data-x` / `data-y` / `data-z` |
| `rotate` | `{x, y, z, order}` | 3D rotation (degrees; `order` is `xyz` / `zyx` / etc.) | `data-rotate-x/y/z` / `data-rotate-order` |
| `scale` | `number` | Scale factor | `data-scale` |
| `transitionDuration` | `number` | Transition duration in ms (overrides global) | `data-transition-duration` |
| `relPosition` | `boolean` | Use relative positioning (inherits previous step's rotation) | `data-rel-position` |
| `relTo` | `string` | Reference a previous step id for relative positioning | `data-rel-to` |

#### Automatic layout

If you don't specify a `position`, the slides are arranged in a 2D grid
(4 columns wide) by default. You can disable this with `autoLayout: false`
in the front-matter:

```yaml
---
autoLayout: false
---
```

### Markdown features

`mddeck` extends [markdown-it](https://github.com/markdown-it/markdown-it)
with the following plugins (all on by default):

| Feature | Syntax | Notes |
|---|---|---|
| **Tables** | `\| col \| col \|\n\| --- \| --- \|` | GFM-style |
| **Strikethrough** | `~~deleted~~` | |
| **Task lists** | `- [x] done\n- [ ] todo` | |
| **Code blocks** | ` ```typescript\nconst x = 1\n``` ` | Highlight.js is bundled; no syntax colors by default |
| **Inline HTML** | `<strong>bold</strong>` | Sanitized — see below |
| **Links** | `[text](url)` | URL scheme allowlist enforced |
| **Emoji** | `:rocket:` or `🚀` | Uses twemoji (Twitter emoji) by default; requires internet for images |
| **Math** | `$E = mc^2$` (inline) / `$$x^2$$` (block) | KaTeX by default — install the `katex` package to enable |
| **Footnotes** | `text[^1]\n[^1]: footnote` | |
| **Heading IDs** | `# Section` | Auto-generated slugs (kebab-case) |
| **Fitting header** | `# <!-- fit -->Big Title` | Scales the title to fit the slide width |
| **Auto-scaling code** | ` ``` ` fenced code | Long code blocks auto-scale down to fit |
| **HTML sanitization (XSS)** | (automatic) | Strips `<script>`, `onerror=`, `javascript:` URLs. See [Security](#security) |

#### Math

`$...$` is inline math, `$$...$$` is a block (display) equation. KaTeX
renders synchronously on the server (in the HTML output), so no JavaScript
runtime is needed in the browser. To switch to MathJax:

```yaml
---
math: mathjax
---
```

> **Note**: MathJax requires installing `@mathjax/src` and several font
> extension packages separately. See the [Installation](#installation) section.

#### Emoji

The default emoji rendering uses [twemoji](https://github.com/twitter/twemoji),
which means shortcodes (`:rocket:`) and unicode characters (`🚀`) both render
as colored Twitter-style SVG images. The images are loaded from a CDN by
default, so the deck requires internet access for emoji to appear.

To disable twemoji and use the platform's native emoji instead:

```js
// mddeck.config.js
module.exports = {
  mddeck: {
    emoji: { shortcode: false, unicode: false },
  },
}
```

#### Security (XSS sanitization)

By default, `mddeck` sanitizes inline HTML in your Markdown using
[xss](https://github.com/leizongmin/js-xss) with marp's allowlist. The
following are **stripped**:

- `<script>` tags and any other disallowed tags
- `onerror=`, `onclick=`, etc. event handlers on all elements
- `javascript:` URLs in `<a href>` and `[link](url)`
- Inline `<style>` and `<iframe>` tags

If you want to **disable sanitization** entirely (e.g. for trusted internal
content), pass `html: true` in the config:

```js
module.exports = {
  mddeck: { html: true },
}
```

Or use a custom allowlist:

```js
const { defaultHTMLAllowList } = require('@mddeck/core')  // (not yet exported — use object form)
module.exports = {
  mddeck: {
    html: {
      ...defaultHTMLAllowList,
      // Add custom tags or attributes
      marquee: ['loop', 'bgcolor'],
    },
  },
}
```

---

## Examples

The `examples/` directory in the [mddeck repo](https://github.com/...) ships
with three ready-made decks. To try them:

```bash
# Build the basic example
mddeck examples/basic.md -o /tmp/basic.html

# Build the M2.5 features demo (math + emoji + XSS)
mddeck examples/m2-features.md -o /tmp/m2.html

# Serve all examples
for f in examples/*.md; do
  mddeck "$f" -o "$(basename $f .md).html"
done
mddeck examples/basic.md --server --port 8080
```

### Minimal example

```markdown
---
theme: default
---

# Welcome

A **markdown-first** slide deck engine.

---

# Code

```typescript
import { MdDeck } from '@mddeck/core'

const deck = new MdDeck({ theme: 'gaia' })
const html = deck.render('# Hello')
```

---

<!-- _position: { x: 1500, y: 0 } -->
<!-- _rotate: { z: 90 } -->

# Rotated

This slide is rotated 90° around Z and offset to the right.

---

<!--
  _position: { x: 0, y: -1500, z: -2000 }
  _rotate: { x: -30, y: 20, z: 0 }
  _scale: 2
-->

# Deep 3D

Scale 2x, X/Y rotation, deep Z position. Press `Esc` to return to the
overview view.
```

---

## Troubleshooting

### "Could not find a Chromium executable"

Install Chromium or set the `PUPPETEER_EXECUTABLE_PATH` environment
variable. See [Optional dependencies](#optional-dependencies).

### PDF output is blank / has wrong dimensions

Make sure the `--pdf-size` matches the front-matter `width` / `height`. The
PDF page is sized exactly to that value, so if your canvas is 1920×1080
but the PDF is A4, content will overflow.

### Math shows as `$x^2$` literal text

Install the `katex` package:

```bash
npm install katex
```

Then either:
- Set `math: katex` in the front-matter (auto-loads the plugin)
- Or set `math: true` and explicitly `use(katexMarpCorePlugin())` in a custom
  integration

### "Package subpath './plugins_katex/index.js' is not defined"

You installed `@mddeck/cli` but don't have `@mddeck/core` resolvable from
the same workspace. Either install both packages together, or use the
[monorepo setup](https://github.com/...).

### Slides overlap / stack on top of each other

Either specify explicit `position` for each slide, or ensure `autoLayout`
is not disabled in the front-matter.

### CLI hangs in `--watch` or `--server` mode

Press `Ctrl+C` to stop. If the process is stuck, send `SIGINT`
(`Ctrl+C` twice in some terminals). On Windows, use `Ctrl+Break`.

---

## See also

- [@mddeck/core](https://github.com/.../packages/core) — the underlying library
- [impress.js documentation](https://github.com/impress/impress.js) — the 3D
  rendering engine
- [marp documentation](https://marp.app/) — the syntax inspiration for the
  front-matter and directive system
- [markdown-it documentation](https://markdown-it.github.io/markdown-it/) —
  the underlying Markdown parser

## License

MIT
