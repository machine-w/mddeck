# mddeck example decks

This directory contains ready-made Markdown decks you can build and study.

## Files

| File | Description |
|---|---|
| [`basic.md`](./basic.md) | A minimal 6-slide deck showcasing the basic 3D positioning directives. No math, no emoji — just the core syntax. |
| [`m2-features.md`](./m2-features.md) | Demos KaTeX math (inline + block), twemoji (shortcodes + unicode), and HTML sanitization (XSS test). Use this as a regression test for the M2 features. |

## Building them

From the repository root:

```bash
# Build basic example → HTML
node packages/cli/bin/mddeck.js examples/basic.md -o examples/basic.html

# Build m2-features with KaTeX math → HTML
node packages/cli/bin/mddeck.js examples/m2-features.md \
  --math katex \
  -o examples/m2-features.html

# Build with PDF output
node packages/cli/bin/mddeck.js examples/basic.md --pdf -o examples/basic.pdf

# Or use the build script which handles all of the above
node examples/build.mjs basic.md
node examples/build-m2.mjs
```

The generated `.html` files are gitignored — they're meant to be regenerated
locally for testing.

## Verifying with a real browser

```bash
# Headless browser screenshot verification (requires playwright + chromium)
node examples/verify.mjs        # → examples/screenshots/
node examples/build-m2.mjs      # → examples/screenshots-m2/
```

These open each generated HTML in a real Chromium instance and capture
screenshots of every slide.

## Anatomy of `basic.md`

```markdown
---
theme: default
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
---

# Welcome to mddeck

A **markdown-first** slide deck engine that produces 3D presentations
powered by [impress.js](https://impress.js).

---

<!-- _position: { x: 1500, y: 0 } -->

# 3D Position

This slide is offset to the right at 3D coordinate (1500, 0, 0).

---

<!--
_position: { x: 0, y: -1500 }
_rotate: { x: 0, y: 0, z: 90 }
-->

# Rotated 90°

This slide is above and rotated 90° around the Z axis.

---

<!--
_position: { x: -1500, y: 0, z: -2000 }
_rotate: { x: -30, y: 20, z: 0 }
_scale: 2
-->

# Deep 3D

This slide uses **scale: 2**, **x: -1500**, **y: 0**, **z: -2000**, and
rotation around X and Y axes.

---

# Code Example

```typescript
import { MdDeck } from '@machine-w/mddeck-core'

const md = new MdDeck({ theme: 'gaia' })
const { html, css } = md.render(markdownSource)
```

The rendered HTML is ready to be served as a single-file deck.

---

# Lists work too

- First item appears immediately
- Second item after a click
- Third item after another click

Use `*` for bullet items that animate in.
```

The first slide uses the default position (no explicit `position`); slides
2-4 use `_position` directives for 3D placement. Slide 4 is rotated and
scaled; slide 6 demonstrates that the standard Markdown features
(code blocks, lists, links) all work.
