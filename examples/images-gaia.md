---
theme: gaia
width: 1920
height: 1080
perspective: 0
transitionDuration: 600
---

![bg opacity:0.25](media/cover-1920x1085.jpg)

# mddeck × gaia 主题 × 图片

把 `theme` 换成 `gaia`，再用 `![bg opacity:0.25]` 把同一张图
做成深色主题的水印背景 —— 这就是 mddeck 的"换肤 + 换背景"能力。

> 同一份 .md，只改 front-matter 就能切主题。
> 改 `--theme` CLI flag 也能覆盖。
>
> 本示例用了 `perspective: 0` —— 幻灯片间是平面平铺切换。

---

![bg left:40%](media/photo4.jpg)

# gaia · 左图右文

gaia 主题的标题是金色，居中，有阴影。
把 `photo4.jpg` 放左边 40% 宽度，给标题一个画框感。

---

<!-- _backgroundColor: "#1c3a5e" -->
<!-- _color: white -->

# 极简：纯色 + 文字

不需要图也能做幻灯片 —— `backgroundColor` 指令 + 文字
就够讲清楚一个观点。

---

![bg](media/photo5.jpg)

# 3D 旋转 + 全屏图

> 想用 3D 镜头效果，把 front-matter 里的 `perspective: 0`
> 改成 `1500`，再给某些幻灯片加 `_rotate` / `_scale` 指令即可。
> （参见 `images-demo.md` 的"3D 联动"那一节。）

---

# 资源清单

| 资源 | 用途 |
|---|---|
| `examples/images-demo.md` | 主示例（default 主题） |
| `examples/images-gaia.md` | gaia 主题变体（当前页） |
| `examples/media/*.jpg` | 测试用的图片（来自 ~/图片/） |
| `examples/images-*.html` | 已生成的 HTML，可以直接在浏览器打开 |

```bash
# 重新构建本示例
node packages/cli/bin/mddeck.js \
  examples/images-gaia.md \
  -o examples/images-gaia.html
```
