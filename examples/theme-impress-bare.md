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
  in your <head> for the original PT Sans / PT Serif typography.
-->

# Welcome to<br>mddeck

then you should try

# **impress.js***

*no rhyme intended*

---

<!-- _position: { x: 700, y: 0, z: -300 } -->
<!-- _rotate: { x: 0, y: 0, z: -8 } -->

# visualize your

# **big**

# thoughts

It's a presentation tool inspired by the idea behind prezi.com

<!-- A decorative vertical tagline on the right side of the slide,
     like the original impress.js demo's sidebar text. -->
<div style="position: absolute; right: 50px; top: 50%;
            transform: translateY(-50%) rotate(90deg);
            transform-origin: right center;
            font-size: 30px; line-height: 1.3; white-space: nowrap;
            opacity: 0.25;">
It's based on the power of CSS3 transforms and transitions
in modern browsers.
</div>

<!-- An upside-down / mirrored whisper in the upper-left corner -->
<div style="position: absolute; top: 80px; left: 80px;
            transform: rotate(-8deg) scaleX(-1);
            transform-origin: left center;
            background: rgba(255, 255, 255, 0.55);
            padding: 6px 12px; font-size: 22px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
            border-radius: 3px;
            opacity: 0.6;">
Want to know more? *use the source, Luke*
</div>

<!-- A large faded "H.SS" stamp at the bottom-right -->
<div style="position: absolute; right: 60px; bottom: 80px;
            font-size: 130px; font-weight: 700;
            opacity: 0.10; letter-spacing: -0.05em;
            line-height: 1;">
H.SS
</div>

---

<!-- _position: { x: -700, y: 0, z: 200 } -->
<!-- _rotate: { x: 0, y: 0, z: 6 } -->

# tiny ideas

`impress-bare` keeps the page's radial gradient but drops the slide's
white card. Useful when the text IS the slide.

<!-- Floating label, slightly rotated, low opacity -->
<div style="position: absolute; top: 60%; left: 110%;
            transform: rotate(-8deg);
            font-size: 24px; letter-spacing: 0.4em;
            text-transform: uppercase;
            opacity: 0.25;">
transforms · transitions · CSS3
</div>

---

<!-- _position: { x: 500, y: 700, z: -400 } -->
<!-- _rotate: { x: -15, y: 0, z: 0 } -->

# and 3D

Every word sits at its own depth. Press the arrow keys to fly
through them.

<span style="display: inline-block; transform: translateZ(80px);">CSS3</span>
<span style="display: inline-block; transform: translateZ(-60px);">transforms</span>
<span style="display: inline-block; transform: translateZ(40px);">and</span>
<span style="display: inline-block; transform: translateZ(-30px);">transitions</span>
<span style="display: inline-block; transform: translateZ(20px);">in</span>
<span style="display: inline-block; transform: translateZ(-10px);">modern</span>
<span style="display: inline-block; transform: translateZ(60px);">browsers.</span>

<!-- Faded "H.SS" stamp at the bottom-right -->
<div style="position: absolute; right: 60px; bottom: 80px;
            font-size: 130px; font-weight: 700;
            opacity: 0.10; letter-spacing: -0.05em;
            line-height: 1;">
H.SS
</div>

---

<!-- _position: { x: -500, y: 700, z: 200 } -->
<!-- _rotate: { x: -15, y: 0, z: 0 } -->

# use the source, Luke

```typescript
import { MdDeck } from '@machine-w/mddeck-core'

const deck = new MdDeck({ theme: 'impress-bare' })
const { html } = deck.render(markdownSource)
```

Build your own theme by writing CSS with `.step { ... }` rules,
drop it in a file, and pass it via `--theme ./mytheme.css`. See
[DEV.md](../DEV.md) for the full reference.

<!-- A small "use the source" badge, tilted slightly -->
<div style="position: absolute; bottom: 100px; right: 100px;
            transform: rotate(-5deg);
            background: rgba(255, 255, 255, 0.55);
            padding: 4px 10px; font-size: 18px;
            border-radius: 3px;
            opacity: 0.5;">
*Luk*e mode
</div>

---

<!-- _position: { x: 0, y: -200, z: 0 } -->

# Questions?

That's all, folks.

<!-- Faded "thanks" trailing off -->
<div style="position: absolute; top: 110%; left: 0;
            font-size: 80px; font-style: italic;
            opacity: 0.2; letter-spacing: 0.1em;">
...thank you.
</div>