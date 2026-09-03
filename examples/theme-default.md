---
theme: default
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
---

# default theme

GitHub-flavored look with a clean white background and a blue accent.
Left-aligned body text, h1 underlined in the accent color, designed
for technical talks and engineering reviews.

---

# Key features

- Markdown-first authoring — slides are `.md` files
- 3D transitions via impress.js (`_position`, `_rotate`, `_scale`)
- KaTeX math, twemoji, XSS-safe HTML sanitization
- 3 built-in themes, plus `-- `--theme` file.css` for custom CSS

---

# Code blocks

```typescript
import { MdDeck } from '@machine-w/mddeck-core'

const deck = new MdDeck({ theme: 'default' })
const { html, css } = deck.render(markdownSource)
```

Code blocks use a subtle grey background and a monospace font, so
they read clearly against the white slide background.

---

# Lists, quotes, links

- First bullet
- Second bullet with **bold** and *italic*
- Third bullet with [a link](https://github.com/machine-w/mddeck)

> Block quotes use a left border in the accent color, just like
> GitHub-flavored Markdown in HTML.