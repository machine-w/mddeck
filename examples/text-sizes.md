---
theme: default
width: 1920
height: 1080
perspective: 0
transitionDuration: 400
---

<!--
This example walks through all 5 font-size utility classes
(tiny / small / normal / big / huge). Each slide uses ONE class,
then the next slide resets to normal — so you can flip through them
and see the scale of each relative to the default 30px body.

You can also stack: put `_class: small` on a single slide inside a
deck whose theme uses a larger base, to compress dense content
without changing the rest of the deck.

Press space / arrow keys to step through.
-->

<!-- _class: tiny -->

# Text-size utility classes

mddeck ships **5 utility classes** in every built-in theme that scale
the whole slide's `font-size` (and therefore all `em`-sized
descendants — h1 / h2 / h3 / code / inline text — proportionally).

| Class | Size | Use case |
|---|---|---|
| `tiny` | 14px | Footnotes, image credits |
| `small` | 20px | Dense lists, code-heavy slides |
| `normal` | 28px | Reset to default |
| `big` | 42px | Title slides, key statements |
| `huge` | 60px | Hero / single-phrase impact slides |

Add `<!-- _class: name -->` at the top of any slide to apply.

---

# Default (no class)

This is the control slide — what every slide looks like **without** a
font-size class. The body text is the theme's default size.

- A regular bullet
- A regular bullet with **bold** and *italic*
- And a small piece of `inline code`

That gives you a baseline to compare the next five slides against.

---

<!-- _class: tiny -->

# tiny (14px)

The **smallest** utility. Useful for fine print, image credits,
footnotes, legal disclaimers, or "see also" links at the bottom of
a slide.

- A regular bullet at tiny scale
- A regular bullet with **bold** and *italic*
- And a small piece of `inline code` — still readable, just compact

---

<!-- _class: small -->

# small (20px)

A step down from default. Best for dense content slides: long lists,
comparison tables, code-heavy material, "frequently asked questions",
or anywhere the default text feels too generous.

- First bullet at small scale
- **Bold text** is still readable
- *Italic text* also readable
- `code` still legible

---

<!-- _class: normal -->

# normal (28px)

Explicitly resets a slide back to the theme's standard size. Useful
when your deck mixes `tiny` / `small` slides with bigger ones — apply
`normal` to keep a single slide consistent with the rest.

- A regular bullet at normal scale
- A regular bullet with **bold** and *italic*
- And a small piece of `inline code`

---

<!-- _class: big -->

# big (42px)

Larger than default. Good for title slides or anywhere you want the
text to feel more present. Body still scales proportionally.

- First bullet at big scale
- **Bold text** is even more emphatic
- *Italic text* reads cleanly
- `code` still legible

---

<!-- _class: huge -->

# huge (60px)

The largest utility. Use sparingly — usually for hero slides,
single-word impact statements, or section dividers between major
topics in a long deck.

- A regular bullet at huge scale
- A regular bullet with **bold** and *italic*
- And a small piece of `inline code`

---

<!-- _class: normal -->

# Mixing classes in one deck

You can stack — different slides in the same deck can use different
classes. For example:

- Title slide → `<!-- _class: huge -->`
- Content slide → (no class, default size)
- Reference / footnote slide → `<!-- _class: tiny -->`

The body text on each slide scales independently. The whole deck
keeps a consistent visual rhythm because each slide picks the size
that matches its purpose.

---

# That's it

You now know all 5 font-size utility classes:
**`tiny` / `small` / `normal` / `big` / `huge`**.

They live in every built-in theme (`default`, `gaia`, `uncover`,
`impress`, `impress-flat`, `impress-bare`). Use `<!-- _class: name -->`
at the top of any slide to apply.

See `examples/README.md` for the full table.
