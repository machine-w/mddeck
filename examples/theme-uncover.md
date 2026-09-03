---
theme: uncover
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
---

# uncover theme

Academic, conference-style. Light gray background, magenta accent,
centered h1/h2 with justified body text, and a small triangle in the
bottom-right corner of every slide as a pagination cue. Designed for
lecture notes and conference talks where content is king.

---

# Key idea

The uncover theme mirrors the visual language of an academic
conference deck:

- Centered headings, justified body
- Magenta accent, restrained palette
- Bottom-right pagination triangle — same on every slide, gives
  the audience a consistent visual anchor

Use use for talks where you're presenting research, a long-form
argument, or anything with a lot of reading.

---

# A block of text

The theme applies `text-align: justify` to paragraphs, which keeps
long-form prose readable on a 1920×1080 canvas. Multiple lines of
explanatory text flow across the slide and align on both edges,
mimicking the feel of a printed page.

---

# Code stays readable

```typescript
import { MdDeck } from '@machine-w/mddeck-core'
const deck = new MdDeck({ theme: 'uncover' })
deck.render(markdownSource)
```

Code blocks get a subtle highlight even on the light background, so
they stand apart from the surrounding prose without competing with
the corner triangle.

---

# In closing

> Pick the theme that fits the room: **default** for technical
> reviews, **gaia** for stage talks, **uncover** for academic
> settings.

Notice the magenta triangle in the corner of every slide — that's
uncover's signature.