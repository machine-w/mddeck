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

This slide has a `<div class="notes">` block. Open the browser, press
**P**, and a separate speaker console window opens showing the
content of that block as speaker notes.

<div class="notes">
<h3>Speaker notes for this slide</h3>
<ul>
  <li>Use the speaker console to keep your audience on the main
      deck while you see your private notes + a preview of the
      <em>next</em> slide.</li>
  <li>The console window also has <strong>restart</strong> and
      <strong>prev</strong> / <strong>next</strong> buttons — same
      keyboard shortcuts as the main deck (← / → / Space).</li>
  <li>Time budget for this slide: <strong>2 minutes</strong>. If
      you're running long, jump to slide 6 (Lists) and wrap up.</li>
</ul>
<p>You can use any HTML inside <code>&lt;div class=&quot;notes&quot;&gt;</code>:
<em>emphasis</em>, <strong>strong</strong>, <code>code</code>,
<a href="https://impress.js.org/">links</a>, lists, even
<strong style="color:#b83280">inline colors</strong>.</p>
<p>Source: see <code>examples/basic.md</code> step 7.</p>
</div>

---

# Thank you

That's the whole deck. Press **P** at any slide to open the
speaker notes for the current step. See
[`examples/basic.md`](./basic.md) for how the notes block is
written.
