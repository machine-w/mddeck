# @mddeck/cli

> 把 Markdown 转换为由 [impress.js](https://github.com/impress/impress.js)
> 驱动的 3D 演示文稿。

`mddeck` CLI 是把 Markdown 文件转换为单文件 impress.js HTML 演示文稿（或
可打印 PDF）的最简单方式。

```bash
$ mddeck presentation.md -o slides.html
✓ presentation.md → slides.html
```

用任意现代浏览器打开 `slides.html`，用方向键、空格键或点击切换幻灯片。
每张幻灯片都可以通过简单的 front-matter directive 在 3D 空间中定位和旋转
（见下方 [幻灯片语法](#幻灯片语法)）。

---

## 目录

1. [安装](#安装)
2. [5 分钟上手](#5-分钟上手)
3. [命令](#命令)
   - [`mddeck <files...>` — 转换为 HTML](#convert)
   - [`--pdf` — 转换为 PDF](#pdf)
   - [`--watch` / `-w` — 变更自动重建](#watch)
   - [`--server` / `-s` — HTTP 服务](#server)
   - [`--stdin` — 从 stdin 读 Markdown](#stdin)
4. [选项](#选项)
5. [配置](#配置)
6. [幻灯片语法](#幻灯片语法)
   - [Front-matter](#front-matter)
   - [幻灯片分隔符](#幻灯片分隔符)
   - [Impress.js directives](#impressjs-directives)
   - [Markdown 特性](#markdown-特性)
7. [示例](#示例)
8. [故障排除](#故障排除)

---

## 安装

```bash
# 项目本地安装（推荐）
npm install --save-dev @mddeck/cli

# 或一次性用 npx
npx @mddeck/cli presentation.md
```

### 可选依赖

| 功能 | 所需包 | 用途 |
|---|---|---|
| **PDF 输出** | `puppeteer-core` + Chromium 二进制 | 用 headless 浏览器做 PDF 渲染 |
| **KaTeX 数学** | `katex` | 快速同步 LaTeX 渲染 |
| **MathJax 数学** | `@mathjax/src` + 多个 font-extension 包 | 慢一些但更完整的 LaTeX 支持 |

如果缺少必需依赖，CLI 会打印清晰警告 —— 永远不会静默失败。

PDF 支持：安装 Chromium 或设置 `PUPPETEER_EXECUTABLE_PATH` / `CHROME_PATH`
指向已有的 Chrome/Edge/Firefox 二进制。CLI 也会自动检测以下路径：

```
/usr/bin/chromium
/usr/bin/chromium-browser
/usr/bin/google-chrome
/usr/bin/google-chrome-stable
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
/Applications/Chromium.app/Contents/MacOS/Chromium
```

---

## 5 分钟上手

1. **创建 Markdown 文件**，开头带 front-matter 和幻灯片分隔符：

   ```markdown
   ---
   theme: gaia
   ---

   # First slide

   Hello, world!

   ---

   <!-- _position: { x: 1500, y: 0 } -->

   # Second slide

   Offset to the right in 3D.
   ```

2. **转换为 HTML**：

   ```bash
   mddeck presentation.md -o slides.html
   ```

3. **在浏览器中打开 `slides.html`**。用方向键 / 空格 / 点击切换幻灯片。
   3D 转场由 impress.js 渲染。

4. **（可选）导出 PDF** 用于打印或分享：

   ```bash
   mddeck presentation.md --pdf -o slides.pdf
   ```

   PDF 输出会把 3D 布局展平 —— 每张幻灯片变成独立一页。

---

## 命令

### `mddeck <files...>` — 转换为 HTML

把一个或多个 Markdown 文件转换为单文件 HTML deck。

```bash
# 基本转换（输出文件名从输入文件名推断）
mddeck presentation.md

# 显式指定输出路径
mddeck presentation.md -o /tmp/deck.html

# 一次处理多个文件
mddeck slides/*.md -o output/
```

输出是自包含的 HTML 文件，CSS、幻灯片 HTML、impress.js 运行时全部内联。
无需 build 步骤、无需 asset 目录 —— 直接用浏览器打开即可。

### `--pdf` — 转换为 PDF

用 headless Chromium（通过 `puppeteer-core`）生成可打印的 PDF。

```bash
mddeck presentation.md --pdf -o slides.pdf
```

工作流程：

1. Markdown 被渲染为自包含 HTML（与 HTML 路径相同）
2. HTML 被加载到 headless Chromium 页面
3. CLI 等待 `body.impress-ready` 类被设置（意味着 `impress().init()` 已完成）
4. 注入 print-mode CSS 覆盖层，把 3D perspective 展平，每张 step 变成独立一页
5. 调用 `page.pdf()`，使用请求的页面尺寸

默认页面尺寸 **1920×1080**（16:9）。用 `--pdf-size` 覆盖：

```bash
mddeck presentation.md --pdf --pdf-size 1280x720 -o slides.pdf
```

> **提示**：要获得最高质量的 PDF，先在普通浏览器中渲染 HTML，然后用浏览器的
> "打印 → 保存为 PDF" 功能 —— Chromium 的打印渲染对复杂布局的文字渲染通常
> 比 CLI 的截图流程更精确。

### `--watch` / `-w` — 变更自动重建

持续监听输入文件变更，自动重新构建输出。

```bash
mddeck presentation.md --watch -o slides.html
# 👀 Watching presentation.md
# ✓ presentation.md → slides.html
# （等待变更……）
```

按 `Ctrl+C` 停止。与 `--server` 组合可获得实时重建的开发工作流。

### `--server` / `-s` — HTTP 服务

把输出目录用 HTTP 服务起来，让多人（或不同设备的浏览器）查看 deck。

```bash
mddeck presentation.md --server --port 8080
# 🚀 mddeck server: http://localhost:8080/
#    Serving: /your/cwd
```

浏览器打开 `http://localhost:8080/` 会看到目录列表，生成的 HTML 文件列在
里面。与 `--watch` 组合即可实时更新：

```bash
mddeck presentation.md --watch --server --port 8080
```

按 `Ctrl+C` 停止。

### `--stdin` — 从 stdin 读 Markdown

从另一个程序管道输入 Markdown：

```bash
# 从 echo / heredoc
echo '# Hello\n\n---\n# World' | mddeck --stdin -o deck.html

# 从另一个工具（如 pandoc、静态站点生成器）
pandoc README.md -t markdown | mddeck --stdin --pdf -o deck.pdf
```

---

## 选项

| 选项 | 别名 | 默认 | 说明 |
|---|---|---|---|
| `--output` | `-o` | （从输入文件名推断） | 输出文件或目录路径 |
| `--pdf` | | `false` | 生成 PDF 而不是 HTML（需要 puppeteer-core） |
| `--pdf-size` | | `1920x1080` | PDF 页面尺寸（如 `1280x720`、`A4`） |
| `--theme` | | `default` | 主题名（`default` / `gaia` / `uncover`）或 CSS 文件路径 |
| `--math` | | `katex`（若已安装） | 数学引擎：`katex` / `mathjax` / `false` |
| `--watch` | `-w` | `false` | 监听输入文件变更并自动重建 |
| `--server` | `-s` | `false` | 用 HTTP 服务输出目录 |
| `--port` | | `8080` | `--server` 模式下的端口 |
| `--browser` | | （自动检测） | Chromium 可执行文件路径（用于 PDF） |
| `--stdin` | | `false` | 从 stdin 读取 Markdown 而不是文件 |
| `--config` | `-c` | （自动发现） | `mddeck.config.js` 文件路径 |
| `--help` | `-h` | | 显示帮助并退出 |
| `--version` | `-v` | | 显示 CLI 版本并退出 |

### 环境变量

| 变量 | 说明 |
|---|---|
| `PUPPETEER_EXECUTABLE_PATH` | 覆盖 PDF 生成的 Chromium 路径 |
| `CHROME_PATH` | `PUPPETEER_EXECUTABLE_PATH` 的备选 |
| `DEBUG` | 开启 debug 日志（`mddeck-cli:*` 命名空间） |

---

## 配置

项目级默认值可放在 `mddeck.config.js`（或 `.mjs` / `.cjs` / `.ts` / `.json`）
于项目根：

```js
// mddeck.config.js

/** @type {import('@mddeck/core').MdDeckOptions} */
const mddeck = {
  theme: 'gaia',
  math: 'katex',
  perspective: 1200,
}

module.exports = {
  mddeck,
  // 其他顶层键：output, watch, server, allowLocalFiles
}
```

配置优先级（后者覆盖前者）：

1. 内置默认值
2. `mddeck.config.js`（或 `.cjs` / `.mjs` / `.ts` / `.json`）
3. `.mddeckrc`（仅 JSON）
4. `package.json` 里的 `mddeck` 键
5. 命令行参数

> **CLI 参数始终覆盖**配置文件。用配置文件设置项目级默认，用 CLI 做
> 一次性覆盖。

### 配置文件 schema

```ts
interface MdDeckConfig {
  /** 默认传入每个 deck 的选项 */
  mddeck?: MdDeckOptions
  /** 输出目录或文件（相对于项目根） */
  output?: string
  /** 默认启用 watch 模式 */
  watch?: boolean
  /** 默认启用 server 模式（或指定端口） */
  server?: boolean | number
  /** 是否允许从 HTML 加载本地文件（图片、字体等） */
  allowLocalFiles?: boolean
  /** 主题名或 CSS 文件路径 */
  theme?: string
}
```

---

## 幻灯片语法

`mddeck` 幻灯片是普通的 Markdown 文件。在标准语法之上增加了两点：

1. **Front-matter**（文件顶部，在 `---` 之间）
2. **HTML 注释**，里面写 YAML directive

两种都遵循 [marp](https://marp.app/) 的同一套语法。

### Front-matter

```markdown
---
theme: gaia
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
math: katex
---
```

支持的 front-matter 键：

| 键 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `theme` | string | `default` | 主题名（`default`、`gaia`、`uncover`）或 CSS 文件路径 |
| `width` / `height` | number | `1920` / `1080` | 画布尺寸（像素） |
| `perspective` | number | `1000` | CSS perspective 值。`0` 关闭 3D（幻灯片变成平面） |
| `maxScale` / `minScale` | number | `3` / `0` | impress.js 缩放上下限 |
| `transitionDuration` | number | `1000` | 转场时长（毫秒） |
| `autoplay` | number | — | 自动播放间隔秒数（传给 impress.js） |
| `math` | string | `katex`（若已安装） | 数学引擎：`katex` / `mathjax` / `false` |

### 幻灯片分隔符

用单独一行的 `---` 分割幻灯片。三个或以上 `-` 字符加可选空格都能识别
—— 规则与 [CommonMark thematic breaks](https://spec.commonmark.org/0.31.2/#thematic-breaks) 相同。

```markdown
# Slide 1

Some content.

---

# Slide 2

More content.

---

# Slide 3
```

如果想按标题自动分割幻灯片，设置 `headingDivider: 1`（或 2、3 …）front-matter，
在指定级别或更深的标题之上开始新幻灯片。

### Impress.js directives

每张幻灯片的 3D 位置、旋转、缩放通过 **HTML 注释**控制（通常放在标题上方）。
注释内用 YAML 语法。

#### 全局 directive（应用于整个 deck）

只在 front-matter 中设置。

#### 局部 directive（应用于当前和后续幻灯片）

```markdown
<!-- position: { x: 1500, y: 0, z: 0 } -->
<!-- rotate: { x: 0, y: 0, z: 45, order: "xyz" } -->
<!-- scale: 1 -->
<!-- transitionDuration: 800 -->
```

#### 作用域局部 directive（仅应用于当前幻灯片）

在指令名前加下划线（`_`）。只对当前幻灯片生效；后续幻灯片沿用之前的
"非作用域"值。

```markdown
<!-- _position: { x: 0, y: -1500 } -->
<!-- _rotate: { z: 90 } -->
<!-- _scale: 2 -->

# This slide is offset upward, rotated 90°, and scaled 2x
```

支持的 directive：

| Directive | 类型 | 说明 | impress.js 属性 |
|---|---|---|---|
| `position` | `{x, y, z}` | 幻灯片中心的 3D 位置 | `data-x` / `data-y` / `data-z` |
| `rotate` | `{x, y, z, order}` | 3D 旋转（度数；`order` 为 `xyz` / `zyx` 等） | `data-rotate-x/y/z` / `data-rotate-order` |
| `scale` | `number` | 缩放因子 | `data-scale` |
| `transitionDuration` | `number` | 转场时长（毫秒），覆盖全局值 | `data-transition-duration` |
| `relPosition` | `boolean` | 使用相对定位（继承前一张 step 的旋转） | `data-rel-position` |
| `relTo` | `string` | 引用前一张 step id 作为相对定位参考 | `data-rel-to` |

#### 自动布局

如果不指定 `position`，默认按 2D 网格（4 列宽）排列幻灯片。可在 front-matter
关闭自动布局：

```yaml
---
autoLayout: false
---
```

### Markdown 特性

`mddeck` 在 [markdown-it](https://github.com/markdown-it/markdown-it)
基础上扩展了以下插件（默认全部开启）：

| 特性 | 语法 | 备注 |
|---|---|---|
| **表格** | `\| col \| col \|\n\| --- \| --- \|` | GFM 风格 |
| **删除线** | `~~deleted~~` | |
| **任务列表** | `- [x] done\n- [ ] todo` | |
| **代码块** | ` ```typescript\nconst x = 1\n``` ` | Highlight.js 已打包；默认无语法高亮 |
| **内联 HTML** | `<strong>bold</strong>` | 已净化，见下文 |
| **链接** | `[text](url)` | URL scheme 受白名单约束 |
| **Emoji** | `:rocket:` 或 `🚀` | 默认 twemoji（Twitter 风）；需要联网加载图片 |
| **数学** | `$E = mc^2$`（行内）/ `$$x^2$$`（块） | 默认 KaTeX —— 安装 `katex` 包即可启用 |
| **脚注** | `text[^1]\n[^1]: footnote` | |
| **标题 ID** | `# Section` | 自动生成 slug（kebab-case） |
| **缩放标题** | `# <!-- fit -->Big Title` | 标题缩放以适应幻灯片宽度 |
| **代码块自动缩放** | ` ``` ` 围栏代码 | 过长代码块自动缩小 |
| **HTML 净化（XSS）** | （自动） | 剥离 `<script>`、`onerror=`、`javascript:` URL。见 [安全](#安全) |

#### 数学公式

`$...$` 是行内公式，`$$...$$` 是块级公式。KaTeX 在服务端同步渲染，
浏览器不需要 JS 运行时。切换到 MathJax：

```yaml
---
math: mathjax
---
```

> **注意**：MathJax 需要单独安装 `@mathjax/src` 及多个 font-extension 包。
> 见 [安装](#安装)。

#### Emoji

默认 emoji 渲染使用 [twemoji](https://github.com/twitter/twemoji)，
所以短码（`:rocket:`）和 unicode 字符（`🚀`）都渲染为彩色 Twitter 风 SVG。
图片默认从 CDN 加载，所以 deck 需要联网才能显示 emoji。

关闭 twemoji 用平台原生 emoji：

```js
// mddeck.config.js
module.exports = {
  mddeck: {
    emoji: { shortcode: false, unicode: false },
  },
}
```

#### 安全（XSS 净化）

默认情况下，`mddeck` 用 [xss](https://github.com/leizongmin/js-xss) +
marp 的白名单净化 Markdown 中的内联 HTML。**会被剥离**的内容：

- `<script>` 标签和其它未允许的标签
- 所有元素上的 `onerror=`、`onclick=` 等事件处理器
- `<a href>` 和 `[link](url)` 中的 `javascript:` URL
- 内联 `<style>` 和 `<iframe>` 标签

如果想**完全关闭净化**（例如对受信的内部内容），在配置里传 `html: true`：

```js
module.exports = {
  mddeck: { html: true },
}
```

或用自定义白名单：

```js
const { defaultHTMLAllowList } = require('@mddeck/core')  // (尚未导出 —— 用对象形式)
module.exports = {
  mddeck: {
    html: {
      ...defaultHTMLAllowList,
      // 添加自定义标签或属性
      marquee: ['loop', 'bgcolor'],
    },
  },
}
```

---

## 示例

[mddeck 仓库](https://github.com/...) 的 `examples/` 目录提供了多个现成的 deck。

```bash
# 构建 basic 示例
mddeck examples/basic.md -o /tmp/basic.html

# 构建 M2.5 特性 demo（数学 + emoji + XSS）
mddeck examples/m2-features.md -o /tmp/m2.html

# 一起构建
for f in examples/*.md; do
  mddeck "$f" -o "$(basename $f .md).html"
done
mddeck examples/basic.md --server --port 8080
```

### 最小示例

```markdown
---
theme: default
---

# Welcome

A **markdown-first** slide deck engine.

---

# Code

```typescript
import { MdDeck } from '@mddeck/core'

const deck = new MdDeck({ theme: 'gaia' })
const html = deck.render('# Hello')
```

---

<!-- _position: { x: 1500, y: 0 } -->
<!-- _rotate: { z: 90 } -->

# Rotated

This slide is rotated 90° around Z and offset to the right.

---

<!--
  _position: { x: 0, y: -1500, z: -2000 }
  _rotate: { x: -30, y: 20, z: 0 }
  _scale: 2
-->

# Deep 3D

Scale 2x, X/Y rotation, deep Z position. Press `Esc` to return to the
overview view.
```

---

## 故障排除

### "Could not find a Chromium executable"

安装 Chromium 或设置 `PUPPETEER_EXECUTABLE_PATH` 环境变量。见
[可选依赖](#可选依赖)。

### PDF 输出空白 / 尺寸错误

确保 `--pdf-size` 与 front-matter 的 `width` / `height` 一致。PDF 页面
精确按这个值定尺寸，所以画布是 1920×1080 但 PDF 是 A4，内容就会溢出。

### 数学公式显示为 `$x^2$` 字面量

安装 `katex` 包：

```bash
npm install katex
```

然后：
- 在 front-matter 设置 `math: katex`（自动加载插件）
- 或设置 `math: true` 并显式 `use(katexMarpCorePlugin())`

### "Package subpath './plugins_katex/index.js' is not defined"

你装了 `@mddeck/cli` 但 `@mddeck/core` 不能解析。请一起装两个包，
或用 [monorepo 设置](https://github.com/...)。

### 幻灯片重叠 / 叠在一起

要么给每张幻灯片显式指定 `position`，要么不要在 front-matter 里关掉
`autoLayout`。

### CLI 在 `--watch` 或 `--server` 模式下卡住

按 `Ctrl+C` 停止。如果进程卡死，发 `SIGINT`（部分终端需要按两次）。
Windows 上用 `Ctrl+Break`。

---

## 另请参阅

- [@mddeck/core](https://github.com/.../packages/core) —— 底层库
- [impress.js 文档](https://github.com/impress/impress.js) —— 3D 渲染引擎
- [marp 文档](https://marp.app/) —— front-matter 和 directive 系统的灵感来源
- [markdown-it 文档](https://markdown-it.github.io/markdown-it/) ——
  底层 Markdown 解析器

## 协议

MIT
