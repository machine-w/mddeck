# mddeck

> **基于 Markdown 的幻灯片工具，搭载 [impress.js](https://github.com/impress/impress.js)
> 实现 3D 转场动画。**

`mddeck` 是一个把 Markdown 文件转换成交互式 3D 演示文稿的工具链。
它是 [Marp](https://marp.app/) 的"近亲" —— 沿用相同的 Markdown 语法、相同
的 front-matter、相同的 directive 系统 —— 唯一不同的是 mddeck 不基于
[Bespoke.js](https://github.com/bespokejs/bespoke) 的平面幻灯片，而是基于
[impress.js](https://github.com/impress/impress.js) 实现 Prezi 风格的 3D 体验。

```markdown
---
theme: default
perspective: 1000
---

# Welcome to mddeck

A **markdown-first** slide deck engine that produces 3D presentations.

---

<!-- _position: { x: 1500, y: 0 } -->
<!-- _rotate: { z: 90 } -->

# Rotated

This slide is offset to the right and rotated 90° around the Z axis.

---

<!--
  _position: { x: 0, y: -1500, z: -2000 }
  _rotate: { x: -30, y: 20 }
  _scale: 2
-->

# Deep 3D

Scale 2×, X/Y rotation, deep Z position. Press `Esc` to return to the
overview view.
```

```bash
$ mddeck presentation.md -o slides.html
✓ presentation.md → slides.html
```

用任意现代浏览器打开 `slides.html`，用方向键、空格键或鼠标点击切换。

---

## 特性

- **Markdown 优先** —— 幻灯片就是普通的 `.md` 文件，任何编辑器都能写
- **3D 转场** —— 每张幻灯片都能通过简单的 front-matter directive 自由定位 / 旋转
- **自包含输出** —— 单 HTML 文件，CSS 和 JS 全部内联
- **PDF 导出** —— headless Chromium 把 deck 转成可打印的 PDF（每页一张幻灯片）
- **监视 & 实时重建** —— 文件变化自动重建，便于快速迭代
- **HTTP server** —— 把输出目录当静态站点服务，多设备访问
- **主题** —— 六个内置主题（`default` / `gaia` / `uncover` / `impress` /
  `impress-flat` / `impress-bare`），支持自定义 CSS
- **数学公式** —— KaTeX（默认）或 MathJax，服务端渲染
- **Emoji** —— twemoji（Twitter 风格 SVG），支持 `:shortcode:` 和 unicode
- **XSS 净化** —— 默认安全，内联 HTML 会被过滤
- **VSCode 扩展** —— 编辑器内实时预览（在 VSCode Marketplace 上以
  `mddeck-slides` 名称发布）

---

## 仓库结构

这是一个使用 [Yarn workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/)
的 monorepo。

```
mddeck/
├── packages/
│   ├── core/                # @machine-w/mddeck-core — 解析器 + 主题 + directives
│   │                         （CLI 和 VSCode 扩展依赖的底层库）
│   ├── cli/                 # @machine-w/mddeck-cli — `mddeck` 命令
│   └── vscode/              # mddeck-slides — VSCode 扩展（已发布）
├── examples/                # 现成的 Markdown deck 样例
└── tsconfig.base.json
```

### 包状态

| 包 | 状态 | 说明 |
|---|---|---|
| `@machine-w/mddeck-core` | ✅ v0.1.7 | 核心框架：Markdown → impress.js HTML + CSS |
| `@machine-w/mddeck-cli` | ✅ v0.1.7 | `mddeck` CLI 命令（HTML / PDF / watch / server） |
| `mddeck-slides` (VSCode) | ✅ v0.1.7 | VSCode 扩展，编辑器内实时预览 |

---

## 5 分钟上手

### 1. 安装 CLI

```bash
npm install --save-dev @machine-w/mddeck-cli
# 或
npx @machine-w/mddeck-cli --help
```

### 2. 写 deck

新建 `presentation.md`：

```markdown
---
theme: default
---

# Slide 1

Your content here.

---

# Slide 2

More content.
```

### 3. 转换

```bash
# HTML（默认）
mddeck presentation.md -o slides.html

# PDF
mddeck presentation.md --pdf -o slides.pdf

# 开发时实时监视 + 服务
mddeck presentation.md --watch --server --port 8080
```

完整 CLI 参考见 [`packages/cli/README.md`](packages/cli/README.md)。

---

## 通过 `@machine-w/mddeck-core` 编程使用

如果你想把 mddeck 集成到自己的工具里（构建流水线、静态站点生成器、服务端渲染），直接使用库即可：

```typescript
import { MdDeck } from '@machine-w/mddeck-core'

const deck = new MdDeck({
  theme: 'default',
  math: 'katex',
  perspective: 1000,
})

// 分别拿 HTML 和 CSS（方便嵌入自定义模板）
const { html, css, comments } = deck.render('# Hello\n---\n# World')

// 或者直接拿完整的单文件 HTML 文档
const document = await deck.renderDocument({
  markdown: '# Hello\n---\n# World',
  title: 'My Deck',
  impressJsBundle: '<inline impress.js source>',
})
```

---

## Markdown 语法

### Front-matter

文件开头的 YAML（在 `---` 之间）：

```yaml
---
theme: gaia
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
math: katex
---
```

### 幻灯片分隔符

一行三个或以上 `-` 字符：

```markdown
# Slide 1

---

# Slide 2
```

### Impress.js directives

用 HTML 注释包裹 YAML：

```markdown
<!-- _position: { x: 1500, y: 0, z: 0 } -->
<!-- _rotate: { x: 0, y: 0, z: 90 } -->
<!-- _scale: 2 -->
```

带下划线前缀的 `_xxx` 是 **scoped** directive —— 只对当前幻灯片生效。
不带下划线的 directive 同时影响当前和后续所有幻灯片，直到被覆盖。

### 标准 Markdown 特性

所有标准 Markdown 特性都支持，外加：

| 特性 | 语法 |
|---|---|
| 行内数学 | `$E = mc^2$` |
| 块级数学 | `$$x^2 + y^2 = z^2$$` |
| Emoji 短码 | `:rocket:` |
| Emoji unicode | `🚀` |
| 代码块 | ` ```typescript ` |
| 表格 | GFM 风格 |
| 删除线 | `~~deleted~~` |
| 任务列表 | `- [x] done` |
| 脚注 | `text[^1]\n[^1]: footnote` |

完整参考见 [`packages/cli/README.md`](packages/cli/README.md#slide-syntax)。

---

## 主题

mddeck 自带六个主题：

| 主题 | 风格 |
|---|---|
| `default` | GitHub 风外观，蓝色 accent，左对齐 |
| `gaia` | 大胆的蓝色渐变，金色 accent，居中内容，带阴影的 h1 |
| `uncover` | 浅灰背景，品红 accent，标题居中，正文两端对齐，右下角分页三角 |
| `impress` | 白底卡片 + 1px 边框 + 软阴影 + 圆角，柔和的径向渐变背景（PT Sans / PT Serif 字体） |
| `impress-flat` | 类似 `impress`，但去掉了 1px 边框和圆角 —— 白卡仍带轻微阴影 |
| `impress-bare` | 类似 `impress-flat`，但 slide 完全透明 —— 文字直接浮在 canvas 上 |

通过 front-matter 的 `theme:` 字段切换，或给 CLI 传 `--theme` 参数。

自定义主题就是普通的 CSS 文件：

```css
/* my-theme.css */
:root {
  --mddeck-bg: #fafafa;
  --mddeck-fg: #2d3748;
  --mddeck-accent: #b83280;
}
.step { /* ... */ }
```

使用：

```bash
mddeck --theme ./my-theme.css presentation.md
```

---

## 浏览器兼容

mddeck 使用了较新的浏览器特性：CSS Custom Properties、CSS Grid、
`backdrop-filter`、`transform-style: preserve-3d`。所有现代浏览器
（Chrome 90+、Firefox 88+、Safari 14+、Edge 90+）均支持。

对于老版本浏览器，impress.js 会 fallback 到一个"不支持"的提示消息。

---

## 开发

这是一个 Yarn workspaces monorepo。搭建开发环境：

```bash
git clone https://github.com/.../mddeck.git
cd mddeck
yarn install
yarn build
yarn test
```

### 跑示例 deck

```bash
# 构建 basic 示例
node packages/cli/bin/mddeck.js examples/basic.md -o /tmp/basic.html

# headless 浏览器验证（需要 playwright + chromium）
node examples/build-m2.mjs
```

### 内部项目结构

```
packages/core/src/
├── mddeck.ts            # 主类
├── markdown/
│   ├── impress.ts       # 插件：把 <section> 重写为 <div class="step">
│   ├── directives.ts    # 插件：注册 position / rotate / scale 等 directive
│   ├── auto_layout.ts   # 插件：没指定 position 时自动 2D 网格布局
│   ├── print_mode.ts    # 插件：PDF 时展平 3D
│   └── marpit_plugin.ts # @marp-team/marpit 的 ESM/CJS 桥接
├── postcss/
│   ├── step_replace.ts    # 把 CSS 里的 `section` 改写成 `.step`
│   └── scaffold_inject.ts # 在打包后的 CSS 末尾注入 scaffold
├── plugins_katex/         # KaTeX 数学公式插件（lazy load）
├── themes/                 # 内置主题（default / gaia / uncover / scaffold）
├── html/                   # XSS 净化（从 marp-core 移植）
├── math/                   # 数学公式框架（从 marp-core 移植）
├── emoji/                  # twemoji 插件（从 marp-core 移植）
├── slug/                   # heading-id 插件（从 marp-core 移植）
├── size/                   # size directive 插件（从 marp-core 移植）
└── auto-scaling/           # fitting-header / code-block 缩放（从 marp-core 移植）
```

---

## 致谢

- **[impress.js](https://github.com/impress/impress.js)** —— 在浏览器端承担 3D 渲染的核心引擎
- **[Marp](https://marp.app/)** / **[marpit](https://marpit.marp.app/)** ——
  Markdown directive 语法的灵感来源
- **[marp-core](https://github.com/marp-team/marp-core)** —— 多个 markdown-it 插件（数学、emoji、XSS 净化、自动缩放）改编自该项目
- **[markdown-it](https://github.com/markdown-it/markdown-it)** —— 底层 Markdown 解析器
- **[twemoji](https://github.com/twitter/twemoji)** —— Twitter 的 emoji 美术资源

## 协议

MIT
