---
name: mddeck-slides
description: Guide users through authoring an mddeck-format slide deck (Markdown → 3D impress.js presentation). Use whenever the user wants to create slides, build a deck, prepare a talk or presentation, or asks for help with the mddeck / impress.js Markdown format — even if they don't explicitly name "mddeck". Triggers on phrases like "make me a slide deck", "help me build a presentation", "I need slides for a talk about X", "convert this outline to slides", or any request to produce a `.md` that follows mddeck conventions. Does NOT trigger for general Markdown editing, non-slide documentation, or rendering pre-existing Markdown that's not slide-shaped.
---

# mddeck-slides

A guided workflow for producing an mddeck-format slide deck from scratch.

`mddeck` is a Markdown-first slide engine that renders to 3D impress.js. Files are `.md` with YAML front-matter + per-slide directives in HTML comments + a `---` separator. See `references/syntax.md` for the full reference; `references/themes.md` for choosing the right theme.

## When to use this skill

Use this skill when the user wants to **create a slide deck** (a presentation, talk, lecture, pitch, demo, walkthrough) and is happy with the mddeck format. The skill handles the conversation flow from "I want a talk about X" to a built `.html` (and optional `.pdf`).

Do **not** use it for:
- Editing an existing mddeck file (just edit it)
- Building a non-slide document (README, blog post, etc.)
- Converting between deck formats (PowerPoint, Keynote, etc.)

## Workflow

Follow these phases in order. Each phase has exactly one decision point shown to the user via `AskUserQuestion`. After every decision, briefly state what you recorded and move on — don't repeat the question.

### Phase 1 — Theme

Ask the user which theme fits their deck. Use `references/themes.md` to show concise recommendations inline (don't dump the whole file). Six built-in themes:

| Theme | When to pick it |
|---|---|
| `default` | Engineering reviews, technical talks. GitHub-style left-aligned body. |
| `gaia` | Stage keynotes, big-room presentations. Bold blue gradient, centered. |
| `uncover` | Academic / conference talks. Light gray, justified body, pagination triangle. |
| `impress` | Prezi-style 3D camera moves. White cards on radial gradient. Default for the "wow" look. |
| `impress-flat` | Like `impress` but borderless. Cleaner print/screenshots. |
| `impress-bare` | Fully transparent slide, type-as-art. Headlines + minimal copy only. |

If the user is unsure, suggest `default` (most flexible, fits any topic). Once picked, **read `assets/templates/<theme>.md`** to grab the starter front-matter + first-slide scaffolding — don't make the user start from scratch.

### Phase 2 — Transition style

Ask the user how they want slides to move between each other. Four options:

| Style | What it feels like | Best for | Front-matter |
|---|---|---|---|
| **Flat 2D slide** | Slides lay out in a 2D grid; no 3D camera move. | Technical talks, dense content, image-heavy decks. | `perspective: 0` |
| **Linear 3D slide** *(default)* | Slides move left-to-right in 3D space. | Sequential narratives — chapters of a book. | `perspective: 1000` (default) |
| **Polyhedron 3D rotation** *(recommended for keynotes)* | Slides sit on the faces of a 3D shape (cube, octahedron); audience rotates around to read each. | Memorable showcase, short punchy decks (≤12 slides), "wow" moments. | `perspective: 1500`+ |
| **Auto-layout (default)** | Let `autoLayoutPlugin` pick. Usually a 3D grid. | When the user has no opinion. | `perspective: 1000` |

**Recommendation logic**: if the user picked a "wow"-flavored theme (`gaia`, `impress`, `impress-flat`) AND the talk is ≤12 slides AND they want a memorable stage presence, recommend **polyhedron**. For technical talks (`default`/`uncover`) or long decks, recommend **flat** (clarity over motion).

For **polyhedron**, **read `references/transitions.md`** for coordinate recipes (cube, octahedron, and how to chain them for >6 slides). The polyhedron template (`assets/templates/impress-cube.md`) shows the cube layout as a working example.

### Phase 3 — Background images

Ask whether the user will provide one or more background images. Options:
- **No images** — pure typographic deck
- **Yes, one image per slide** — full-bleed `![bg cover](image)` style (keynote look)
- **Yes, mixed: a few images for some slides, others text-only** — most common
- **Yes, split layout** — `![bg left:33%](image)` with text on the right

If yes, ask the user to drop images into the working directory now (or paste paths). Record the filenames; you'll embed them as `![bg cover](<filename>)` or `_backgroundImage: url(...)` directives in the final markdown.

### Phase 4 — Duration / page count

Ask: "About how long is the talk?" Use one of:
- **5 min** → 5 slides
- **10 min** → 10 slides
- **20 min** → 20 slides
- **30 min** → 30 slides
- **60 min** → 60 slides
- **I'll specify the page count** → ask how many, no estimation

Default pace is **~1 slide per minute** (keynote rhythm). If the user wants a different pace, mention you can adjust (faster: 30 sec/slide; slower: 2 min/slide).

### Phase 5 — Content input

Ask the user to describe what they want to cover. Phrase it as: "Tell me the topic, audience, and key points you want to hit. Bullet points are fine — I'll fill in prose and structure." Record verbatim what they said. If they only give a vague topic ("a talk on Rust"), ask 1-2 clarifying questions before moving on (audience? setting? specific sub-topics?).

### Phase 6 — Outline for confirmation

**Always** generate an outline before writing the final markdown. Format:

```
1. Title slide: <headline>
2. <slide idea>
3. <slide idea>
…
N. Closing / Thanks
```

Present it as a numbered list. Use `AskUserQuestion` to confirm with options like:
- **Looks good, proceed**
- **Reorder some slides**
- **Add/remove slides**
- **Rewrite the angle** (e.g. "more technical", "less technical", "more visuals")

Iterate until the user approves.

### Phase 7 — Generate the markdown

Write the deck. Follow `references/syntax.md` exactly. Important rules:

1. **Front-matter** matches the chosen theme (start from `assets/templates/<theme>.md`).
2. **Slide separators**: `---` on its own line.
3. **Per-slide directives** go in HTML comments ABOVE the slide body. YAML syntax. Example:
   ```
   <!-- _position: { x: 1500, y: 0 } -->
   
   # Title text
   ```
5. **Images**: if user provided paths, use `![bg cover](<filename>)` for full-bleed, `![bg left:33%](<filename>)` for split layout, `![w:600px](<filename>)` for inline.
6. **Math**: if the topic involves formulas, write `$inline$` and `$$block$$` and add `math: katex` to front-matter (or `math: mathjax`). Mention to the user they may need to install katex separately (`yarn add katex`).
7. **Title slide**: every deck starts with one. Big `# Headline`, brief subtitle.
8. **Closing slide**: every deck ends with one. "Thanks / Questions / Contact".
9. **File extension**: write to `<user-specified-name>.md`. Default to `deck.md` if they didn't say.

Write the file with `Write`. Confirm the path to the user.

### Phase 8 — Build outputs

Ask: "Build the deck?"
- **HTML only** — `mddeck <file>.md -o <file>.html`
- **HTML + PDF** — `mddeck <file>.md --pdf -o <file>.pdf`. Note: PDF needs Chromium on `$PATH` (or set `PUPPETEER_EXECUTABLE_PATH`). If the user chose PDF, run `which chromium google-chrome chrome 2>/dev/null` first; warn if not found and offer to skip PDF.
- **Just markdown, no build** — for cases where the user wants to edit before rendering.

### Phase 9 — CLI installation

Before running any `mddeck` command, check whether the CLI is installed:

```bash
which mddeck || command -v mddeck
```

If found, great — proceed. If not, walk the user through installation:

**Fastest path (cross-platform): npm**
```bash
npm install -g @machine-w/mddeck-cli
```
Requires Node.js 18+.

**Pre-built binaries (no Node needed)**: https://github.com/machine-w/mddeck/releases/latest
- macOS Apple Silicon: `mddeck-*-macos-arm64.dmg`
- macOS Intel: `mddeck-*-macos-x64.dmg`
- Linux: `mddeck-*-linux-x64.AppImage`
- Windows: `mddeck-*-windows-x64-setup.exe`

**If npm install fails** (e.g. user lacks permission): try `sudo npm install -g ...`, or fall back to the binary download.

Only attempt automated install if the user explicitly asks. Otherwise just give the commands and let them run.

## Notes on directive selection

- **`_position: { x, y, z }`** is for 3D placement when the theme uses perspective. Skip for flat themes (`impress-flat`, `impress-bare`, or any theme with `perspective: 0`).
- **`_rotate: { x, y, z }`** is rarely needed; one rotation slide near the start is usually enough to show off the 3D effect.
- **`_class: small|tiny|big|huge`** is the safest "make this slide more / less dense" knob. Use freely.
- **`_note: |`** is great for speaker notes — multi-line, markdown-rendered. Mention it if the topic is complex.
- **`_backgroundImage: url(...)`** is equivalent to `![bg cover](image)` but more explicit; use one or the other per slide, not both.

## Verifying the output

After writing the markdown, before building, glance through it and check:
- Every `---` is on its own line (no surrounding text).
- Every directive comment closes properly: `<!-- ... -->`.
- Image filenames match what the user actually provided.
- Front-matter is valid YAML (no tabs, no unquoted special chars).
- Slide count matches what was approved in Phase 6.

If something looks off, fix it before running the build.

## Tone

Match the user's tone. If they want a "no-nonsense 5-minute lightning deck", be terse. If they want a "15-slide keynote for a design conference", lean more verbose. Default to **efficient and helpful**, with occasional warmth — don't be saccharine.