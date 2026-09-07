# mddeck 示例 deck

本目录包含现成的 Markdown deck，可以直接构建并参考。

## 文件清单

| 文件 | 描述 |
|---|---|
| [`basic.md`](./basic.md) | 最简 6 张幻灯片，演示 3D 定位 directive。无数学、无 emoji —— 只展示核心语法。 |
| [`m2-features.md`](./m2-features.md) | 演示 KaTeX 数学（行内 + 块）、twemoji（短码 + unicode）、HTML 净化（XSS 测试）。可作为 M2 特性的回归测试。 |
| [`math-demo.md`](./math-demo.md) | **新增**。14 张幻灯片，演示 mddeck 的全部数学公式场景：行内 / 块级、上下标、分数根号、求和积分极限、希腊字母、矩阵（`pmatrix` / `bmatrix` / `vmatrix`）、多行对齐（`aligned`）、分段函数（`cases`）、向量、概率统计、几个著名公式（傅里叶变换、薛定谔方程、麦克斯韦-玻尔兹曼分布等）。需用 `--math katex` 构建，并使用 `examples/build-math.mjs` 自动注入 katex CSS。 |
| [`images-demo.md`](./images-demo.md) | **新增**。13 张幻灯片，演示 mddeck 的全部图片用法：`backgroundImage` 指令、`![bg](...)` 简写、左图右文 (`![bg left:33%]`)、`cover` / `contain` 平铺模式、半透明水印、内联尺寸控制、与 3D `position` / `rotate` / `scale` 联动。配套测试图见 `media/`。 |
| [`images-gaia.md`](./images-gaia.md) | **新增**。基于 `gaia` 主题的图片示例，演示"换主题 + 换背景"的组合。 |
| [`theme-default.md`](./theme-default.md) | 内置 `default` 主题 —— GitHub 风格外观、蓝色 accent、左对齐。适合工程评审与技术演讲。 |
| [`theme-gaia.md`](./theme-gaia.md) | 内置 `gaia` 主题 —— 大胆的蓝色渐变、金色 accent、居中内容、带阴影的 h1。适合 keynote 风格的舞台演讲。 |
| [`theme-uncover.md`](./theme-uncover.md) | 内置 `uncover` 主题 —— 浅灰背景、品红 accent、标题居中、正文两端对齐、右下角分页三角。适合学术 / 会议演讲。 |
| [`theme-impress.md`](./theme-impress.md) | 内置 `impress` 主题 —— 复刻[官方 impress.js 演示](https://impress.js.org/)：白底卡片、柔和的径向渐变背景、PT Sans / PT Serif 字体。按 **Esc** 退出全屏，**P** 打开演讲者控制台。 |
| [`theme-impress-flat.md`](./theme-impress-flat.md) | 类似 `impress`,但去掉了 1px 边框和圆角 —— 白卡仍带轻微的 drop shadow,保留一点深度感。 |
| [`theme-impress-bare.md`](./theme-impress-bare.md) | 类似 `impress-flat`,但 slide 完全透明(无卡、无阴影) —— 文字直接浮在 canvas 上,像排版艺术。 |

## `media/` 目录

`media/` 子目录存放图片示例所需的测试图，全部从 `~/图片/` 复制而来：

| 文件 | 尺寸 | 用途 |
|---|---|---|
| `cover-1920x1085.jpg` | 1920×1085 | 全屏背景 (`![bg]` / `_backgroundImage`) |
| `avatar-1080x1080.jpg` | 1080×1080 | 头像、左图右文 (`![bg left:33%]`) |
| `logo-225x225.png` | 225×225 | 平铺背景 (`backgroundRepeat: repeat`) |
| `photo1.png` ... `photo5.jpg` | 各类 | 内联图片、网格混排 |

这些图只是**测试占位**。要换图直接改 `.md` 文件里的路径即可。

## 构建方式

从仓库根目录运行：

```bash
# 任意示例 → HTML
node packages/cli/bin/mddeck.js examples/<name>.md -o examples/<name>.html

# m2-features + KaTeX 数学 → HTML
node packages/cli/bin/mddeck.js examples/m2-features.md \
  --math katex \
  -o examples/m2-features.html

# 输出 PDF
node packages/cli/bin/mddeck.js examples/basic.md --pdf -o examples/basic.pdf

# 数学公式示例：CLI 自动内联 katex 样式和字体，生成单文件 HTML
node packages/cli/bin/mddeck.js examples/math-demo.md \
  --math katex -o examples/math-demo.html

# 或用 build 脚本一步完成
node examples/build.mjs basic.md
node examples/build-m2.mjs
```

### 关于 KaTeX 公式渲染

mddeck 用 [KaTeX](https://katex.org/) 渲染数学公式。CLI 启用方式：

```bash
node packages/cli/bin/mddeck.js examples/math-demo.md --math katex \
  -o examples/math-demo.html
```

**v0.1.8+ 行为**：CLI 会**自动**从 `node_modules/katex/dist/katex.min.css` 读取样式表，
把里面所有 `url(fonts/...)` 引用替换成 base64 `data:` URI 后**内联**到 HTML 里。
生成的 HTML 是**单文件**的：不需要 katex CSS 文件、不需要 fonts 目录、拷给谁都能打开。
示例目录里**也不需要**再放 `katex.min.css` 或 `fonts/` —— 全部烧进 HTML 就行。

如果项目里没装 `katex` 包，CLI 会打印警告并 fallback 到原始 LaTeX 源码输出
（公式会显示两遍 —— 这是 MathML 没被 CSS 隐藏的副作用）。修复方法：

```bash
npm install katex   # 或 yarn add katex
```

### 主题

三个主题示例展示了每个内置主题的视觉效果。主题通过 front-matter `theme:` 指令选择（不需要 CLI flag）。并列运行试试：

```bash
node packages/cli/bin/mddeck.js examples/theme-default.md  -o examples/theme-default.html
node packages/cli/bin/mddeck.js examples/theme-gaia.md     -o examples/theme-gaia.html
node packages/cli/bin/mddeck.js examples/theme-uncover.md  -o examples/theme-uncover.html
```

自定义主题：写自己的 CSS 文件，通过 `--theme` 传入：

```bash
node packages/cli/bin/mddeck.js examples/basic.md \
  --theme ./my-custom-theme.css \
  -o examples/basic.html
```

生成的 `.html` 文件已被 `.gitignore` 忽略 —— 它们应该在本地测试时
重新生成。

## 用真实浏览器验证

```bash
# headless 浏览器截图验证（需要 playwright + chromium）
node examples/verify.mjs        # → examples/screenshots/
node examples/build-m2.mjs      # → examples/screenshots-m2/
```

这两个脚本会在真实的 Chromium 中打开生成的 HTML，并对每张幻灯片截图。

## `basic.md` 结构解析

```markdown
---
theme: default
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
---

# Welcome to mddeck

A **markdown-first** slide deck engine that produces 3D presentations
powered by [impress.js](https://impress.js).

---

<!-- _position: { x: 1500, y: 0 } -->

# 3D Position

This slide is offset to the right at 3D coordinate (1500, 0, 0).

---

<!--
_position: { x: 0, y: -1500 }
_rotate: { x: 0, y: 0, z: 90 }
-->

# Rotated 90°

This slide is above and rotated 90° around the Z axis.

---

<!--
_position: { x: -1500, y: 0, z: -2000 }
_rotate: { x: -30, y: 20, z: 0 }
_scale: 2
-->

# Deep 3D

This slide uses **scale: 2**, **x: -1500**, **y: 0**, **z: -2000**, and
rotation around X and Y axes.

---

# Code Example

```typescript
import { MdDeck } from '@machine-w/mddeck-core'

const md = new MdDeck({ theme: 'gaia' })
const { html, css } = md.render(markdownSource)
```

The rendered HTML is ready to be served as a single-file deck.

---

# Lists work too

- First item appears immediately
- Second item after a click
- Third item after another click

Use `*` for bullet items that animate in.
```

第一张幻灯片用默认位置（没有显式 `position`）；第 2-4 张用
`_position` directive 设置 3D 位置。第 4 张做了旋转 + 缩放；第 6 张
演示标准 Markdown 特性（代码块、列表、链接）都正常工作。
