---
theme: default
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
---

# Welcome to mddeck

A **markdown-first** slide deck engine produces 3D prez senta powered by [impress.js](https://impress.js).

---

<!-- _position: { x: 1500, y: 0 } -->

# 3D Position

This slide is offset to the right at 3D coordinate (1500, 0, 0).

The 3D transition between slides is rendered by impress.js in the browser.

---

<!--
_position: { x: 0, y: -1500 }
_rotate: { x: 0, y: 0, z: 90 }
-->

# Rotated 90°

This slide is above and rotated 90° around the Z axis.

---

<!--
_position: { x: -1500, y: 0, z: -800 }
_rotate: { x: -15, y: 10, z: 0 }
_scale: 1.5
-->

# Deep 3D

This slide uses **scale: 1.5**, **x: -1500**, **y: 0**, **z: -800**, and
mild rotation around the X and Y axes — enough to show off the 3D
effect while keeping the slide comfortably inside the viewport.

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

---

# Speaker Notes Demo

This slide uses the `_note` directive to attach speaker notes
without writing any raw HTML in the markdown. The note value is
rendered as Markdown, so you can use the same syntax you already
know.

Open the browser, press **P**, and the speaker console window
shows the content below attached to this slide.

<!--
_note: |
  ### Speaker notes for this slide

  - The speaker console keeps your audience on the main deck while
    you see private notes and a preview of the *next* slide.
  - Time budget: **2 minutes**. If running long, jump to slide 6
    (Lists) and wrap up.
  - Links work too: [impress.js](https://impress.js.org/) — and so
    does `inline code` and fenced blocks.
-->

---

# Thank you

That's the whole deck. Press **P** at any slide to open the
speaker notes for the current step. Notes are written via the
`_note:` directive in an HTML comment, using **plain markdown**
(no raw HTML in the notes value). See
[`examples/basic.md`](./basic.md) for the directive syntax.

