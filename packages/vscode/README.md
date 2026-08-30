# mddeck for VS Code

> Live preview of [mddeck](https://github.com/...) slide decks inside VS Code.

This extension integrates the [`@machine-w/mddeck-core`](../core) parser into VS Code's
built-in Markdown preview, so you can write Markdown slides and see them as
an interactive 3D impress.js deck on the right side of your editor.

## Features

- **Live preview** — any `.md` file with a `theme:` directive (or any
  mddeck front-matter) is rendered as an impress.js deck in the preview
  pane. Standard Markdown files render normally.
- **Export to HTML / PDF** — `mddeck: Export Slide Deck…` shells out to
  `@machine-w/mddeck-cli` to produce a single-file HTML deck or a PDF.
- **New mddeck file** — `mddeck: New mddeck Markdown File` creates a new
  `.md` file pre-populated with the mddeck template.
- **Toggle mddeck** — quickly enable/disable mddeck rendering per-file
  with `mddeck: Toggle mddeck feature in current Markdown`.
- **Theme support** — built-in themes (`default`, `gaia`, `uncover`) plus
  custom CSS files via the `markdown.mddeck.themes` setting.

## Installation

### From source

```bash
git clone https://github.com/.../mddeck.git
cd mddeck/packages/vscode
yarn install
yarn package   # produces .vsix
code --install-extension mddeck-vscode-0.1.0.vsix
```

### Marketplace

_Coming soon — once published._

## Usage

1. **Open a Markdown file** with a mddeck front-matter:

   ```markdown
   ---
   theme: default
   ---

   # Slide 1

   ---

   # Slide 2
   ```

2. **Open the Markdown preview** (`Ctrl+Shift+V` / `Cmd+Shift+V`). The
   preview pane shows the impress.js deck. Use arrow keys to navigate.

3. **Export** via the Command Palette:
   - `mddeck: Show All Commands…` (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Select `mddeck: Export Slide Deck…`
   - Choose HTML or PDF
   - Pick the destination file

## Settings

All settings are under the `markdown.mddeck.*` namespace.

| Setting | Type | Default | Description |
|---|---|---|---|
| `markdown.mddeck.breaks` | enum | `inherit` | Render line breaks as `<br>` |
| `markdown.mddeck.html` | enum | `default` | Allow raw HTML in Markdown |
| `markdown.mddeck.mathTypesetting` | enum | `katex` | Math engine (katex / mathjax / off) |
| `markdown.mddeck.themes` | array | `[]` | Custom CSS theme files |
| `markdown.mddeck.exportType` | enum | `html` | Default export format |
| `markdown.mddeck.exportAutoOpen` | boolean | `true` | Open exported file after export |

## Markdown syntax

See the [CLI README](../cli/README.md#slide-syntax) for the full syntax
reference — front-matter, slide separators, 3D positioning directives, and
the supported markdown features.

## Commands

| Command | Description |
|---|---|
| `mddeck: Export Slide Deck…` | Save the active Markdown file as HTML or PDF |
| `mddeck: New mddeck Markdown File` | Create a new file pre-populated with mddeck template |
| `mddeck: Open mddeck Extension Settings` | Jump to the mddeck settings page |
| `mddeck: Show All Commands…` | Show all mddeck commands in a quick pick |
| `mddeck: Toggle mddeck feature in current Markdown` | Toggle `mddeck: true/false` in the front-matter |

## How it works

The extension hooks into VS Code's built-in Markdown preview by returning
a custom `extendMarkdownIt(md)` function. When VS Code opens a preview,
this function is called; we patch `md.render` to detect mddeck-marked
files and route them through `@machine-w/mddeck-core` instead of vanilla markdown.

The impress.js runtime is then initialized by the script embedded in the
generated HTML (see `@machine-w/mddeck-core`'s `renderDocument`).

## License

MIT
