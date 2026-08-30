# @mddeck/core

> The mddeck parser + theme + directive library.
>
> Markdown → impress.js HTML, with no runtime dependencies on a browser.

This is the lower-level library that powers both the `@mddeck/cli`
command-line tool and the planned `mddeck-vscode` editor extension.

If you're building a custom integration (e.g. embedding mddeck into a
static site generator, a server-side rendering service, or your own
build pipeline), this is the package you want.

## Installation

```bash
npm install @mddeck/core
# or in a monorepo
yarn add @mddeck/core
```

**Peer dependencies** (most are optional, only needed for the features
you use):

| Peer | Required for |
|---|---|
| `katex` | KaTeX math rendering (default math engine) |
| `@mathjax/src` + font-extension packages | MathJax math rendering (alternative to KaTeX) |
| `impress.js` | The browser-side runtime — bundled with the CLI, you supply your own when using the library directly |

## Quick start

```typescript
import { MdDeck } from '@mddeck/core'

const deck = new MdDeck({
  theme: 'gaia',
  math: 'katex',
  perspective: 1000,
})

// Render to HTML + CSS
const { html, css, comments } = deck.render(`
---
theme: gaia
---

# Slide 1

Hello!

---

# Slide 2

World!
`)

console.log(html) // <div id="impress"><div class="step">...</div></div>
console.log(css)  // gaia theme styles + scaffold
```

## API

### `new MdDeck(options)`

Construct a deck instance.

```ts
interface MdDeckOptions {
  /** Theme name (default / gaia / uncover) or path to a CSS file. */
  theme?: string

  /** Markdown → impress.js HTML options */
  printable?: boolean       // default false
  width?: number           // default 1920
  height?: number          // default 1080
  perspective?: number     // default 1000
  autoLayout?: boolean     // default true (auto-arrange slides without position)

  /** Markdown extension options */
  math?: false | 'katex' | 'mathjax' | MathJaxOptions
  emoji?: EmojiOptions
  html?: boolean | HTMLAllowList   // XSS sanitization
  slug?: SlugOptions
}
```

### `deck.render(markdown, env?)`

Render markdown to `{ html, css, comments }`.

```ts
const { html, css, comments } = deck.render(markdown)
// html:   string  — slide HTML (one <div class="step"> per slide)
// css:    string  — packed theme CSS
// comments: string[][]  — HTML comments per slide (for speaker notes)
```

By default `html` is a single string. Pass `env: { htmlAsArray: true }` to
get an array with one entry per slide:

```ts
const { html } = deck.render(markdown, { htmlAsArray: true })
// html: string[]
```

### `deck.renderAsString(markdown, env?)`

Async — same as `render()`, but waits for lazy-loaded math plugins to
register before rendering. Returns the same shape but with `html` always
as a single string (joining the array form).

```ts
const { html, css } = await deck.renderAsString(markdown)
```

### `deck.renderDocument(opts)`

Async — render a complete single-file HTML document with theme CSS and
an inlined impress.js runtime.

```ts
const html = await deck.renderDocument({
  markdown: '# Hello\n---\n# World',
  title: 'My Deck',
  author: 'Me',
  impressJsBundle: '/* impress.js source code */', // required
  extraCss: '',                                  // optional
  printable: false,                              // flatten 3D (for PDF)
})

// Write to disk or serve via HTTP
fs.writeFileSync('slides.html', html)
```

### Custom themes

Pass a CSS string as the `theme` option:

```ts
const deck = new MdDeck({
  theme: `
    /* @theme my-theme */
    :root {
      --mddeck-bg: #fafafa;
      --mddeck-fg: #2d3748;
      --mddeck-accent: #b83280;
    }
    .step { font-family: 'Georgia', serif; }
  `,
})
```

The CSS scalar `--mddeck-bg`, `--mddeck-fg`, `--mddeck-accent` are
defined by the scaffold and consumed by all built-in themes.

## Markdown syntax

See the [CLI README](../../packages/cli/README.md#slide-syntax) for the
full syntax reference (front-matter, directives, math, emoji, XSS).

## Plugins

`@mddeck/core` is built on top of
[marpit](https://marpit.marp.app/), the markdown-it-based slide framework.
You can extend a `MdDeck` instance with any marpit plugin:

```ts
import { MdDeck } from '@mddeck/core'
import { someCustomMarpitPlugin } from 'some-package'

const deck = new MdDeck({ theme: 'default' })
deck.use(someCustomMarpitPlugin)
```

To write your own markdown-it plugin, import the helper:

```ts
import marpitPlugin from '@marp-team/marpit/plugin'

const myPlugin = marpitPlugin((md) => {
  // md is a markdown-it instance with `md.marpit` pointing to the deck
  md.core.ruler.after('marpit_directives_apply', 'my_plugin', (state) => {
    // your plugin logic here
  })
})

deck.use(myPlugin)
```

## License

MIT
