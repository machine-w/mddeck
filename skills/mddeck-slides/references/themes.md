# mddeck themes

Quick guide for choosing between the six built-in themes. Pick one in Phase 1 of the workflow.

## The six themes at a glance

### `default` — GitHub-flavored

- Left-aligned body, sans-serif, blue accent, generous whitespace.
- Best for: engineering reviews, technical talks, internal team updates.
- Defaults well: works for any topic that doesn't need a strong visual mood.
- Reads cleanly in screenshots / shared links.

### `gaia` — Bold keynote

- Centered content, large shadowed headings, blue gradient background, gold accent.
- Best for: stage keynotes, conference talks, big-room presentations.
- Less suitable for: code-heavy slides (small code blocks fight with the centered layout).

### `uncover` — Academic / journalistic

- Light gray background, magenta accent, centered headings, justified body text, pagination triangle in the bottom-right.
- Best for: academic talks, conference papers, journalism presentations.
- Pacing signal: the pagination triangle subtly reminds the audience of where they are in the talk.

### `impress` — Prezi-style 3D

- White slide cards on a soft radial-gradient canvas, PT Sans / PT Serif typography (with web-font fallback).
- Best for: anything where you want the 3D camera-move wow factor.
- Pairs naturally with `_position` / `_rotate` directives.
- Drops `perspective: 0` if you want flat slides within an otherwise-impress deck.

### `impress-flat` — Borderless prezi

- Like `impress` but the white card has no border or rounded corners. Subtler drop shadow.
- Best for: clean print / screenshot output, or when `impress`'s border feels heavy.

### `impress-bare` — Transparent card

- Like `impress-flat` but the slide is fully transparent — text floats directly on the canvas.
- Best for: type-as-art headlines, single-phrase hero slides, posters.
- Use sparingly: dense content slides fight with the lack of a card.

## How to recommend

If the user doesn't have a strong preference:

- **For technical / engineering talks** → `default`.
- **For a keynote / stage presentation** → `gaia`.
- **For an academic talk or research presentation** → `uncover`.
- **For a "wow, what's this 3D thing" demo or creative pitch** → `impress`.
- **For a clean printable handout** → `impress-flat` or `impress-bare`.

When in doubt, `default` is the safest pick — it doesn't impose a strong visual mood, and every feature works with it.

## When to override `perspective`

- Default value in most themes: `1000`. Gives a noticeable 3D camera move between slides.
- Set `perspective: 0` for flat slide transitions (no 3D camera). Useful for:
  - Image-heavy decks (the cover bg image wants to be the focus, not a 3D move).
  - Long technical decks where consistent 2D pacing helps readability.
- With `perspective: 0`, all `_position` / `_rotate` directives are ignored.

## When to add `transitionDuration`

Default `800` ms. Adjust:

- **Faster** (`400`–`600` ms) — punchy tech talks, demo decks, short lightning talks.
- **Slower** (`1000`+ ms) — keynote-style with deliberate pacing.

## Other front-matter knobs

| Knob | When to set it |
|---|---|
| `width` / `height` | Bigger if you want to use very large `_position` offsets (like `{ x: 5000 }`). Default `1920×1080`. |
| `math: katex` | Only when the deck has `$...$` formulas. Requires `katex` npm package. |
| `math: mathjax` | Same as katex but uses MathJax. Slightly slower, more compatible. |