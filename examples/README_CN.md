# mddeck 示例 deck

本目录包含现成的 Markdown deck，可以直接构建并参考。

## 文件清单

| 文件 | 描述 |
|---|---|
| [`basic.md`](./basic.md) | 最简 6 张幻灯片，演示 3D 定位 directive。无数学、无 emoji —— 只展示核心语法。 |
| [`m2-features.md`](./m2-features.md) | 演示 KaTeX 数学（行内 + 块）、twemoji（短码 + unicode）、HTML 净化（XSS 测试）。可作为 M2 特性的回归测试。 |

## 构建方式

从仓库根目录运行：

```bash
# basic 示例 → HTML
node packages/cli/bin/mddeck.js examples/basic.md -o examples/basic.html

# m2-features + KaTeX 数学 → HTML
node packages/cli/bin/mddeck.js examples/m2-features.md \
  --math katex \
  -o examples/m2-features.html

# 输出 PDF
node packages/cli/bin/mddeck.js examples/basic.md --pdf -o examples/basic.pdf

# 或用 build 脚本一步完成
node examples/build.mjs basic.md
node examples/build-m2.mjs
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
import { MdDeck } from '@mddeck/core'

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
