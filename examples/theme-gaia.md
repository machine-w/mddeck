---
theme: gaia
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
---

# gaia theme

Bold blue gradient background, gold accents, centered content for
keynote-style talks. The h1 picks up a soft text-shadow so it lifts
off the dark canvas. Designed for stage presentations where the
visuals carry the message.

---

# Why gaia

- Big, centered headlines (h1 is 3em with shadow)
- High contrast: gold accent on deep blue
- Centered paragraphs (good for slogans and TL;DRs)
- Dark-friendly — easier on projector screens

Use gaia when the slide content is short and punchy.

---

# Code on dark

```typescript
import { MdDeck } from '@machine-w/mddeck-core'

const deck = new MdDeck({ theme: 'gaia' })
deck.render(markdownSource)
```

Code blocks keep a translucent white background and a warm yellow
foreground so they remain readable on the dark gradient.

---

# The takeaway

> Choose your theme to match your audience: **default** for
> engineering, **gaia** for keynote, **uncover** for academic.

The triangle at the bottom-right of gaia slides is left blank by
design — gaia doesn't use pagination.