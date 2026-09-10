---
theme: default
math: katex
width: 1920
height: 1080
perspective: 0
transitionDuration: 600
---
<!-- _class: small -->
# 数学公式 :tada:

用 Markdown 写带数学公式的幻灯片 —— 靠 **KaTeX** 渲染。

本示例演示 mddeck 数学支持的 6 大场景：

1. 行内公式 `$ ... $`
2. 块级公式 `$$ ... $$`
3. 上下标、分数、根号
4. 求和、积分、极限
5. 矩阵（pmatrix / bmatrix / vmatrix）
6. 多行对齐（aligned、cases 分段函数）

按 **空格 / 方向键** 翻页。

> 启用方式：front-matter 加 `math: katex`，或 CLI 加 `--math katex`。
> 需要先 `yarn add katex`（mddeck 把 katex 列为 optionalDependency）。

---

# 行内公式

行内公式嵌在文字中间：

- 质能方程 $E = mc^2$ 是相对论的核心结果
- 欧拉恒等式 $e^{i\pi} + 1 = 0$ —— "数学中最美的公式"
- 勾股定理 $a^2 + b^2 = c^2$ 描述直角三角形三边关系
- 复数乘法 $(a+bi)(c+di) = (ac-bd) + (ad+bc)i$

`$...$` 两个美元符号包裹的就是行内公式，会渲染成 HTML 而不是 LaTeX 源码。

---
<!-- _class: small -->
# 块级公式

块级公式独占一行，居中显示：

$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

`$$...$$` 两个美元符号独占一行的就是块级公式。

---
<!-- _class: small -->

# 上下标与分数

**上标**用 `^`，**下标**用 `_`。组合多个字符用 `{}`：

$$
x^{2n+1} + y_{i,j} + z_{a_1 a_2 \dots a_n}
$$

**分数** `\frac{分子}{分纲}`：

$$
\frac{a}{b} + \frac{1}{\frac{c}{d}} = \frac{ad + bc}{bd}
$$

**根号** `\sqrt{}` 和 `\sqrt[n]{}`：

$$
\sqrt{x} \quad \sqrt[3]{8} = 2 \quad \sqrt[n]{x^n} = x
$$

---
<!-- _class: small -->
# 求和、积分、极限

## 求和与求积

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
\qquad
\prod_{i=1}^{n} i = n!
$$

## 定积分

$$
\int_a^b f(x)\,dx = F(b) - F(a)
\qquad
\iint_D g(x,y)\,dx\,dy
$$

## 极限

$$
\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e
\qquad
\lim_{x \to 0} \frac{\sin x}{x} = 1
$$

---
<!-- _class: small -->
# 希腊字母 & 常用符号

| LaTeX | 渲染 |
|---|---|
| `\alpha \beta \gamma \delta` | $\alpha \;\beta \;\gamma \;\delta$ |
| `\epsilon \varepsilon \zeta \eta` | $\epsilon \;\varepsilon \;\zeta \;\eta$ |
| `\theta \lambda \mu \nu \xi` | $\theta \;\lambda \;\mu \;\nu \;\xi$ |
| `\pi \rho \sigma \tau \phi` | $\pi \;\rho \;\sigma \;\tau \;\phi$ |
| `\Gamma \Delta \Theta \Lambda` | $\Gamma \;\Delta \;\Theta \;\Lambda$ |
| `\Pi \Sigma \Phi \Psi \Omega` | $\Pi \;\Sigma \;\Phi \;\Psi \;\Omega$ |

运算符：`\times \div \pm \mp \cdot \leq \geq \neq \approx \equiv \to \mapsto \infty`

$\pm \times \div \cdot \leq \geq \neq \approx \equiv \to \infty$

---

# 矩阵
<!-- _class: small -->
`pmatrix` 是圆括号矩阵：

$$
A = \begin{pmatrix}
a_{11} & a_{12} & a_{13} \\
a_{21} & a_{22} & a_{23} \\
a_{31} & a_{32} & a_{33}
\end{pmatrix}
$$

`bmatrix` 是方括号，`vmatrix` 是竖线（行列式）：

$$
B = \begin{bmatrix}
1 & 2 \\
3 & 4
\end{bmatrix}
\qquad
\det(B) = \begin{vmatrix}
1 & 2 \\
3 & 4
\end{vmatrix} = -2
$$

---
<!-- _class: small -->
# 多行对齐

`aligned` 环境用 `&` 对齐，`\\` 换行：

$$
\begin{aligned}
f(x) &= (x+1)^2 \\
&= x^2 + 2x + 1
\end{aligned}
\qquad
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0\mathbf{J} + \mu_0\varepsilon_0\frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

上面四个公式是麦克斯韦方程组的微分形式。

---
<!-- _class: small -->
# 分段函数

`cases` 配合 `&` 和 `\\` 写分段函数：

$$
f(x) = \begin{cases}
-x, & x < 0 \\
0, & x = 0 \\
x, & x > 0
\end{cases}
$$

激活函数 ReLU：

$$
\text{ReLU}(x) = \max(0, x) = \begin{cases}
0, & x \le 0 \\
x, & x > 0
\end{cases}
$$

---
<!-- _class: small -->
# 向量 / 范数

向量通常用粗体或箭头：

$$
\mathbf{v} = \langle v_1, v_2, v_3 \rangle
\qquad
\|\mathbf{v}\| = \sqrt{v_1^2 + v_2^2 + v_3^2}
$$

点积和叉积：

$$
\mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{3} a_i b_i
\qquad
\mathbf{a} \times \mathbf{b} = \begin{vmatrix}
\mathbf{i} & \mathbf{j} & \mathbf{k} \\
a_1 & a_2 & a_3 \\
b_1 & b_2 & b_3
\end{vmatrix}
$$

---
<!-- _class: small -->
# 概率与统计

正态分布密度函数：

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)
$$

贝叶斯定理：

$$
P(A \mid B) = \frac{P(B \mid A) \cdot P(A)}{P(B)}
$$

期望与方差：

$$
\mathbb{E}[X] = \sum_{i=1}^{n} x_i p_i
\qquad
\text{Var}(X) = \mathbb{E}\!\left[(X - \mathbb{E}[X])^2\right]
$$

---
<!-- _class: small -->
# 几个著名公式

傅里叶变换：

$$
\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x)\, e^{-2\pi i x \xi}\,dx
$$

欧拉-拉格朗日方程：

$$
\frac{\partial L}{\partial q} - \frac{d}{dt}\frac{\partial L}{\partial \dot{q}} = 0
$$

薛定谔方程：

$$
i\hbar \frac{\partial}{\partial t} \Psi(\mathbf{r}, t)
= \hat{H} \Psi(\mathbf{r}, t)
$$

麦克斯韦-玻尔兹曼分布：

$$
f(v) = \left(\frac{m}{2\pi k_B T}\right)^{3/2} \exp\!\left(-\frac{mv^2}{2k_B T}\right)
$$

---
<!-- _class: small -->
# 公式行内 / 块级 排版建议

**行内公式** `$ E = mc^2 $` 适合简单符号或简写术语 —— 不要写太长的行内公式，否则会拉爆排版。

**块级公式** `$$ ... $$` 独立成段，居中显示 —— 重要结论、定理、推导用块级。

**多行公式** 用 `aligned` / `cases` / `matrix` 环境 —— KaTeX 完整支持。

**颜色标注** 在 mddeck 里可以借 HTML / 主题 CSS 给特定公式上色：

$$
\color{blue}{E} = \color{red}{m} \color{green}{c^2}
$$

---
<!-- _class: tiny -->
<!-- _backgroundColor: "#0d1117" -->
<!-- _color: white -->

# 总结 :rocket:

| 场景 | 语法 | 场景 | 语法 |
|---|---|---|---|
| 行内 | `$ E = mc^2 $` | 块级 | `$$ ... $$` 独占一行 |
| 分数 | `\frac{a}{b}` | 根号 | `\sqrt{x}` / `\sqrt[n]{x}` |
| 求和 | `\sum_{i=1}^{n}` | 积分 | `\int_a^b f(x)\,dx` |
| 极限 | `\lim_{x \to 0}` | 矩阵 | `\begin{pmatrix}...\end{pmatrix}` |
| 对齐 | `\begin{aligned}...\end{aligned}` | 分段 | `\begin{cases}...\end{cases}` |
| 颜色 | `\color{red}{text}` |  |  |*

```bash
# 启用 katex 需要先装包
yarn add katex
node packages/cli/bin/mddeck.js examples/math-demo.md \
  --math katex -o examples/math-demo.html
```

> **所有公式在 PDF 导出时也会被保留** —— mddeck 用同一份 KaTeX 输出，
> 浏览器和 PDF 看到的公式完全一致。
> 切换到 MathJax 引擎：front-matter 写 `math: mathjax`，或 CLI `--math mathjax`。
> 不渲染公式：`math: false`，所有 `$...$` 当作普通文本。
