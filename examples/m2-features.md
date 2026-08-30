---
theme: default
math: katex
---

# M2.5 Features Demo

KaTeX math, twemoji, and XSS sanitization.

---

# Math (KaTeX)

Inline: $E = mc^2$ and $\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$.

Block:

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

---

# Emoji

Shortcodes: :rocket: :tada: :heart: :fire:

Unicode: 🚀 🎉 ❤️ 🔥

---

# XSS Sanitization

The mddeck core sanitizes HTML in markdown:

- `<script>alert('xss')</script>` is stripped
- `<a href="javascript:alert('xss')">click</a>` becomes `<a href="">click</a>`
- Safe tags like `<strong>` and `<em>` are preserved

**Markdown link with javascript: URL**: [click](javascript:alert('xss'))
