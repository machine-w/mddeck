---
theme: impress-bare
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
---

<!--
  Optional: drop a `<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=PT+Serif:wght@400;700&display=swap">`
  tag into your <head> to render this deck with the exact PT Sans +
  PT Serif typography it was designed for. Without it the theme still
  works — the font-family declarations fall back to system
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

const deck = new MdDeck({ theme: 'impress-bare' })
const { html } = deck.render(markdownSource)
```

`impress-bare` is like `impress` but the slide itself is fully
transparent — no white card, no border, no shadow. Text sits
directly on the page's radial-gradient canvas.

---

# tiny ideas

Best for the "type-as-art" feel where the text is the only thing
on screen. Code blocks and link pills still have their own subtle
backgrounds so they remain readable when sitting on the gradient.

---

# It's in 3D

Press the **arrow keys** to navigate. Press **P** to open the
speaker console.

> The speaker console is part of the impress.js runtime bundled into
> every mddeck HTML — no extra code needed.

---

# Questions?

Build your own theme by writing CSS with `.step { ... }` rules, drop
it in a file, and pass it via `--theme ./mytheme.css`. See
[DEV.md](../DEV.md) for the full reference.