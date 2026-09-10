# mddeck syntax reference

Concise reference for everything you can put in an mddeck `.md` file. Read this before generating a deck.

## 1. Front-matter (top of file)

```markdown
---
theme: default | gaia | uncover | impress | impress-flat | impress-bare
width: 1920
height: 1080
perspective: 1000        # 3D depth. 0 = flat (no 3D camera moves)
transitionDuration: 800  # ms, between slides
math: katex | mathjax | false   # optional. omit if no formulas
---
```

- `theme` is required.
- `width` / `height` set the slide canvas (1920×1080 is the default; bigger numbers = bigger 3D world).
- `perspective` controls 3D depth. `0` = flat. Anything > 500 = noticeable 3D effect.
- `transitionDuration` is in milliseconds.
- `math` is optional. `katex` and `mathjax` both require the corresponding npm package installed in the project (`yarn add katex` or `yarn add mathjax`).

## 2. Slide separator

Three or more `-` on their own line, with blank lines around it:

```markdown
# Slide 1 content

---

# Slide 2 content
```

If you put text on the `---` line, it breaks the deck. Don't.

## 4. Per-slide directives (HTML comments)

Put directives ABOVE the slide body in an HTML comment. The comment content is parsed as YAML.

```markdown
<!-- _position: { x: 1500, y: 0 } -->

# This slide is offset right
```

Multi-directive form:

```markdown
<!--
_position: { x: 0, y: -1500, z: -800 }
_rotate: { x: -15, y: 10 }
_scale: 1.5
-->

# Deep 3D slide
```

### Common directives

| Directive | Type | What it does |
|---|---|---|
| `_position: { x, y, z }` | object | 3D position offset. Defaults: `x:0, y:0, z:0`. |
| `_rotate: { x, y, z }` | object | 3D rotation in degrees. |
| `_scale: N` | number | Slide scale. `1` = normal, `2` = double size. |
| `_class: tiny \| small \| normal \| big \| huge` | string | Font-size utility (all built-in themes). |
| `_backgroundImage: url("path")` | string | Full-slide background image. |
| `_backgroundSize: cover \| contain \| <css>`>` | string | Background sizing. |
| `_backgroundPosition: center \| top \| bottom \| left \| right` | string | Background position. |
| `_backgroundRepeat: no-repeat \| repeat \| repeat-x \| repeat-y` | string | Background repeat. |
| `_backgroundColor: <css color>` | string | Solid background color. |
| `_color: <css color>` | string | Text color (use to invert for dark backgrounds). |
| `_note: \|` | multiline | Speaker notes (multi-line markdown). Press `P` in browser to open the speaker console. |

Note: `_rotate` and `_position` are **only meaningful with `perspective > 0`**. With `perspective: 0` they're ignored.

### Font-size utility classes

Add `<!-- _class: name -->` at the top of any slide:

| Class | Slide `font-size` | Use case |
|---|---|---|
| `tiny` | 14px | Footer footnotes, image credits |
| `small` | 20px | Dense content (long lists, code-heavy slides) |
| `normal` | 28px | Reset to default |
| `big` | 42px | Title slides, key statements |
| `huge` | 60px | Hero slides, single-word impact |

Classed slides scale all `em`-sized descendants proportionally, so changing the class scales everything in the slide (headings, lists, code).

## 5. Markdown body

Standard markdown works: `#` `##` `###` headings, `**bold**`, `*italic*`, `` `code` ``, fenced code blocks, ordered / unordered lists, blockquotes (`>`), tables, links.

### Image shortcuts

`mddeck` extends the Marpit image syntax with several useful shortcuts:

| Markdown | What it does |
|---|---|
| `![bg cover](image.png)` | Full-bleed background, cover scaling. |
| `![bg contain](image.png)` | Full-bleed background, contain scaling. |
| `![bg left:33%](image.png)` | Image on the left 33%, text on the right. |
| `![bg right:33%](image.png)` | Mirror of left. |
| `![bg opacity:0.15](image.png)` | Background as faint watermark. |
| `![w:600px](image.png)` | Inline image with width control. |
| `![w:400px h:300px](image.png)` | Inline with width and height. |
| `![blur:3px](image.png)` | Apply CSS filter. |

Combine: `![bg cover opacity:0.4 left:50%](image.png)`.

Image paths are resolved **relative to the `.md` file's directory**, so drop images in the same folder or use `./images/foo.png`.

## 6. Math

With `math: katex` (or `mathjax`) in front-matter:

- Inline: ``$E = mc^2$`` renders as a formula in the line of text.
- Block: ```` ```
$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$
``` ```` (on its own line, with blank lines around it).

Color works: `$\color{red}{x} + \color{blue}{y}$`.

If `katex` isn't installed locally, `mddeck` warns and falls back to escaped LaTeX — but the build doesn't throw. Don't forget to `yarn add katex` in the user's project if they want formulas.

## 7. Speaker notes

```markdown
<!--
_note: |
  ### Speaker notes for this slide

  - The audience already knows about X.
  - Time budget: **2 minutes**.
  - Backup demo URL if the live demo fails: https://...
-->
```

Notes are rendered as Markdown, so lists, code, links all work. They appear in the speaker console window (press `P` in the browser).

## 8. Building the deck

```bash
# HTML
mddeck my-deck.md -o my-deck.html

# HTML + PDF (needs Chromium on PATH or PUPPETEER_EXECUTABLE_PATH)
mddeck my-deck.md --pdf -o my-deck.pdf

# Math mode
mddeck my-deck.md --math katex -o my-deck.html

# Custom theme (CSS file)
mddeck my-deck.md --theme ./my-theme.css -o my-deck.html

# Live preview
mddeck my-deck.md --watch --server --port 8080
```

The output `.html` is fully self-contained: the impress.js engine is inlined, no extra runtime needed. Open in any browser.

## Quick-checklist before saving the file

- Front-matter parses as YAML (no tabs, quote strings with special chars).
- Every `---` separator is on its own line.
- Every directive comment opens (`<!--`) and closes (`-->`).
- Image filenames in directives match files the user actually has.
- Slide count matches the outline the user approved.
- Front and back slides are reasonable (no slide #1 is just `# .`).