# @machine-w/mddeck-core

> mddeck 解析器 + 主题 + directive 库。
>
> 把 Markdown 转换为 impress.js HTML，运行时零浏览器依赖。

这是底层的核心库，同时驱动着 `@machine-w/mddeck-cli` 命令行工具和
`mddeck-vscode` 编辑器扩展。

如果你想把 mddeck 集成到自己的工具里（构建流水线、静态站点生成器、
服务端渲染服务等），就用这个包。

## 安装

```bash
npm install @machine-w/mddeck-core
# 或在 monorepo 中
yarn add @machine-w/mddeck-core
```

**Peer dependencies**（大部分可选，只在你用到的功能需要时安装）：

| Peer | 用途 |
|---|---|
| `katex` | KaTeX 数学公式渲染（默认数学引擎） |
| `@mathjax/src` + 多个 font-extension 包 | MathJax 数学公式渲染（KaTeX 的替代） |
| `impress.js` | 浏览器端运行时 —— CLI 自带，直接用库时需自行提供 |

## 5 分钟上手

```typescript
import { MdDeck } from '@machine-w/mddeck-core'

const deck = new MdDeck({
  theme: 'gaia',
  math: 'katex',
  perspective: 1000,
})

// 渲染为 HTML + CSS
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
console.log(css)  // gaia 主题样式 + scaffold
```

## API

### `new MdDeck(options)`

构造 deck 实例。

```ts
interface MdDeckOptions {
  /** 主题名（default / gaia / uncover）或 CSS 文件路径 */
  theme?: string

  /** Markdown → impress.js HTML 选项 */
  printable?: boolean       // 默认 false
  width?: number           // 默认 1920
  height?: number          // 默认 1080
  perspective?: number     // 默认 1000
  autoLayout?: boolean     // 默认 true（未指定 position 时自动排版）

  /** Markdown 扩展选项 */
  math?: false | 'katex' | 'mathjax' | MathJaxOptions
  emoji?: EmojiOptions
  html?: boolean | HTMLAllowList   // XSS 净化
  slug?: SlugOptions
}
```

### `deck.render(markdown, env?)`

把 Markdown 渲染为 `{ html, css, comments }`。

```ts
const { html, css, comments } = deck.render(markdown)
// html:   string  —— 幻灯片 HTML（每个 slide 一个 <div class="step">）
// css:    string  —— 打包后的主题 CSS
// comments: string[][]  —— 每张幻灯片的 HTML 注释（讲者备注用）
```

默认 `html` 是一个字符串。传 `env: { htmlAsArray: true }` 可拿每页一份的数组：

```ts
const { html } = deck.render(markdown, { htmlAsArray: true })
// html: string[]
```

### `deck.renderAsString(markdown, env?)`

**异步** —— 与 `render()` 相同，但会先等待 lazy-load 的数学插件注册完再渲染。
返回同样的结构，但 `html` 始终是单个字符串（数组合并版）。

```ts
const { html, css } = await deck.renderAsString(markdown)
```

### `deck.renderDocument(opts)`

**异步** —— 渲染完整的单文件 HTML 文档，内嵌主题 CSS 和 impress.js 运行时。

```ts
const html = await deck.renderDocument({
  markdown: '# Hello\n---\n# World',
  title: 'My Deck',
  author: 'Me',
  impressJsBundle: '/* impress.js source code */', // 必填
  extraCss: '',                                  // 可选
  printable: false,                              // 展平 3D（用于 PDF）
})

// 写盘或通过 HTTP 提供
fs.writeFileSync('slides.html', html)
```

### 自定义主题

把 CSS 字符串作为 `theme` 选项传入：

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

CSS 变量 `--mddeck-bg`、`--mddeck-fg`、`--mddeck-accent` 由 scaffold
定义，被所有内置主题消费。

## Markdown 语法

完整的语法参考见 [CLI README](../../packages/cli/README.md#slide-syntax)
（front-matter、directives、数学、emoji、XSS）。

## 插件

`@machine-w/mddeck-core` 基于 [marpit](https://marpit.marp.app/)（基于 markdown-it
的幻灯片框架）。你可以给 `MdDeck` 实例装任何 marpit 插件：

```ts
import { MdDeck } from '@machine-w/mddeck-core'
import { someCustomMarpitPlugin } from 'some-package'

const deck = new MdDeck({ theme: 'default' })
deck.use(someCustomMarpitPlugin)
```

要写自己的 markdown-it 插件，导入辅助函数：

```ts
import marpitPlugin from '@marp-team/marpit/plugin'

const myPlugin = marpitPlugin((md) => {
  // md 是 markdown-it 实例，`md.marpit` 指向 deck
  md.core.ruler.after('marpit_directives_apply', 'my_plugin', (state) => {
    // 你的插件逻辑
  })
})

deck.use(myPlugin)
```

## 协议

MIT
