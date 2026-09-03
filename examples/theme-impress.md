---
theme: impress
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
---

<!--
  Optional: drop a `<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=PT+Serif:wght@400;700&display=swap">`
  tag into your <head> to render this deck with the exact PT Sans +
  PT Serif typography it was designed for. Without it the theme
  still works — the font-family declarations fall back to system
  Helvetica Neue / Georgia.
-->

# Welcome to<br>mddeck

then you should try

# **impress.js***

*no rhyme intended*

---

# visualize your

# **big**

# thoughts

It's a presentation tool based on the power of CSS3 transforms and
transitions in modern browsers.

---

# use the source, Luke

```typescript
import { MdDeck } from '@machine-w/mddeck-core'

const deck = new MdDeck({ theme: 'impress' })
const { html } = deck.render(markdownSource)
```

The example you are reading is built from this Markdown file plus the
`impress` theme — that combination produces the soft gray gradient,
the white slide card, and the PT Serif headings you see above.

---

# tiny ideas

The `impress` theme borrows the visual language of the
[official impress.js demo deck](https://impress.js.org/) — restrained
palette, generous padding, white slide cards on a radial-gradient
canvas. Use it when you want your audience focused on the words
rather than the chrome.

---

# It's in 3D

Press the **arrow keys** to navigate. Press **Esc** to see the
**overview mode** — a thumbnail grid of every slide, click any one
to jump there. Press **P** to open the **speaker console**.

> The overview grid and speaker console are part of the impress.js
> runtime that's bundled into every mddeck HTML. No extra code needed.

---

# Questions?

Build your own theme by writing CSS with `.step { ... }` rules, drop
it in a file, and pass it via `--theme ./mytheme.css`. See
[DEV.md](../DEV.md) for the full reference.