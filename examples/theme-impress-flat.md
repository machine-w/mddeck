---
theme: impress-flat
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

const deck = new MdDeck({ theme: 'impress-flat' })
const { html } = deck.render(markdownSource)
```

`impress-flat` is the same as the `impress` theme, but with the
slide's border, box-shadow, and border-radius removed — the text
floats directly on the canvas without a card frame.

---

# tiny ideas

Same restrained palette and PT Serif typography as `impress`, just
without the visual chrome. Useful when you want a cleaner, more
modern look.

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