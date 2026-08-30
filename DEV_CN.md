# mddeck — 开发与测试指南（中文版）

> 这是一份手把手的实战手册，介绍如何搭建开发环境、运行测试套件，
> 并在发布前对每个功能做端到端验证。

本文假设你使用类 Unix shell（Linux/macOS/WSL），已安装 Node.js ≥ 18
以及 `yarn` 或 `npm` 之一。文中所有命令均在 **Node 22.7.0 + yarn 1.22.22**
环境（Linux Manjaro 系统）下验证通过。

---

## 1. 环境依赖

| 工具 | 用途 | 检测方法 |
|---|---|---|
| Node.js ≥ 18 | 所有功能的基础 | `node --version` |
| yarn 1.x | 工作区依赖管理 | `yarn --version` |
| Chromium / Chrome | CLI `--pdf` + 浏览器截图 | `which chromium` 或 `which google-chrome` |
| (可选) `playwright` 包 | examples 目录的 headless 浏览器截图 | 通过 yarn 自动安装 |

如果你没有 Chromium 但有 Firefox / Chrome，可设置 `PUPPETEER_EXECUTABLE_PATH`
环境变量 —— CLI 会优先使用它，再 fallback 到内置的硬编码路径列表。

---

## 2. 初始安装

进入仓库目录并安装所有工作区依赖：

```bash
cd /home/macihne/myworkspace/mari/mddeck
yarn install
```

该命令会：

- 解析 `@mddeck/core`、`@mddeck/cli`、`@mddeck/vscode` 三个工作区包
- 安装 `playwright`（通过 examples 目录）、`chromium-bidi` 等
- 把三个包链接起来，使得 CLI 能 `import('@mddeck/core')`、VSCode 扩展
  能 `import('@mddeck/cli')`

> **提示**：如果看到 `Couldn't find package "@mddeck/core@workspace:*"`，
> 说明 `package.json` 失去同步了。请运行 `yarn install --force`。

验证安装：

```bash
ls packages/core/dist/index.js          # build 后会存在
ls packages/cli/bin/mddeck.js           # install 后会存在
```

---

## 3. 编译所有包

```bash
# 按依赖顺序编译所有工作区包
yarn build
```

或单独编译：

```bash
yarn workspace @mddeck/core build        # → packages/core/dist/
yarn workspace @mddeck/cli build        # → packages/cli/dist/
cd packages/vscode && yarn build       # → packages/vscode/dist/
```

core 包是 CLI 和 VSCode 扩展的依赖，所以改库代码时要先编译 core。

---

## 4. 运行单元测试套件

三个包都有 vitest 测试套件。可以单独跑（更快反馈），也可以通过工作区根一次性跑：

```bash
# 所有包
yarn test

# 只跑 core（M1 + M2 + M2.5：解析器、directives、数学、emoji、XSS、slug、katex）
yarn workspace @mddeck/core test

# 只跑 CLI（文件 I/O、配置加载、输出路径）
yarn workspace @mddeck/cli test

# 只跑 VSCode 扩展（directives 定义、package.json 完整性）
yarn workspace mddeck-vscode test
```

预期输出（v0.1.0）：

```
✓ test/mddeck.test.ts  (13 tests)
✓ test/m2.test.ts       (15 tests)        ← 28 个 core 测试
✓ test/cli.test.ts      ( 7 tests)
✓ test/extension.test.ts ( 6 tests)
─────────────────────────────────
Test Files  4 passed (4)
Tests       41 passed (41)
```

Watch 模式（边写代码边测试）：

```bash
yarn workspace @mddeck/core test:watch
```

---

## 5. 端到端：构建示例 deck

仓库自带两个示例 deck：

- `examples/basic.md` — 6 张幻灯片演示 3D 定位（无数学、无 emoji）
- `examples/m2-features.md` — KaTeX 数学 + twemoji + XSS 净化演示

### 5.1 用 CLI 构建

```bash
# basic → HTML
cd packages/cli
node bin/mddeck.js ../../examples/basic.md -o /tmp/basic.html

# basic → PDF（自动检测 Chromium）
node bin/mddeck.js ../../examples/basic.md --pdf -o /tmp/basic.pdf

# m2-features → HTML（启用 KaTeX）
node bin/mddeck.js ../../examples/m2-features.md --math katex -o /tmp/m2.html
```

在浏览器中打开生成的 HTML 即可看到 impress.js deck。

### 5.2 用辅助脚本构建

```bash
# 在仓库根目录
node examples/build.mjs        # basic deck + headless 浏览器截图
node examples/build-m2.mjs     # M2 features + headless 浏览器截图
```

这两个脚本还会启动 headless Chromium，对每张幻灯片截图保存到
`examples/screenshots/` 和 `examples/screenshots-m2/`。

查看截图：

```bash
xdg-open examples/screenshots/step-1.png       # Linux
open    examples/screenshots-m2/step-3.png    # macOS
```

### 5.3 Watch 模式（实时重建）

```bash
cd packages/cli
node bin/mddeck.js ../../examples/basic.md --watch -o /tmp/basic.html
# 输出：
# 👀 Watching /path/to/examples/basic.md
# ✓ basic.md → /tmp/basic.html
# （等待文件变化……）

# 在另一个终端编辑 examples/basic.md，输出会自动重建
```

按 `Ctrl+C` 停止。

### 5.4 Server 模式（HTTP 服务）

```bash
mkdir -p /tmp/mddeck-demo && cp examples/basic.md /tmp/mddeck-demo/
cd packages/cli
node bin/mddeck.js /tmp/mddeck-demo/basic.md --server --port 8080
# 输出：
# ✓ basic.md → /tmp/mddeck-demo/basic.html
# 🚀 mddeck server: http://localhost:8080/
```

浏览器打开 `http://localhost:8080/` 会看到目录列表，点击 `basic.html`
进入 deck，用方向键切换幻灯片。

在另一个终端编辑 `/tmp/mddeck-demo/basic.md` 并刷新页面 —— server
模式会每次变更都重新构建。

---

## 6. 端到端：PDF 渲染

PDF 输出使用 **headless Chromium（puppeteer-core）**。CLI 流程：

1. 把 Markdown 渲染成自包含 HTML（impress.js 已内联）
2. 在 headless Chromium 中加载这个 HTML
3. 等待 `body.impress-ready` 类被设置（即 `impress().init()` 已完成所有 3D transform 计算）
4. 注入 print-mode CSS 把 3D perspective 展平
5. 调用 `page.pdf()`，页面尺寸默认为 `1920×1080`

```bash
cd packages/cli

# 默认 1920×1080 PDF
node bin/mddeck.js ../../examples/basic.md --pdf -o /tmp/basic.pdf

# 自定义页面尺寸
node bin/mddeck.js ../../examples/basic.md \
  --pdf --pdf-size 1280x960 \
  -o /tmp/basic-4x3.pdf
```

验证：

```bash
file /tmp/basic.pdf
# → PDF document, version 1.4, 7 page(s)   (6 张幻灯片 + fallback-message)
```

如果系统装了多个 Chrome，可指定具体路径：

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
  node bin/mddeck.js ../../examples/basic.md --pdf -o /tmp/basic.pdf
```

---

## 7. 端到端：VSCode 扩展

VSCode 扩展不能直接用 `node` 测试（需要 VSCode runtime），但有两种实用的本地调试方法：

### 7.1 方案 A：打包成 `.vsix` 安装

```bash
npm install -g @vscode/vsce              # 一次性安装打包工具
cd packages/vscode && vsce package      # → packages/vscode/mddeck-vscode-0.1.0.vsix

# 启动 VSCode 并安装扩展
code --install-extension packages/vscode/mddeck-vscode-0.1.0.vsix

# 或者用隔离的用户数据目录测试，不影响你的主安装
code --user-data-dir=/tmp/vscode-test \
     --install-extension packages/vscode/mddeck-vscode-0.1.0.vsix
```

然后：

1. `File → Open Folder` → 选择 `mddeck/` 仓库（或任何包含 mddeck
   Markdown 的目录）
2. 打开 `examples/basic.md`
3. 在命令面板执行 `mddeck: Show All Commands…`
4. 打开 Markdown 预览（`Ctrl+Shift+V`）—— 应该看到 impress.js deck

### 7.2 方案 B：用 Extension Development mode 直接加载源码

跳过打包步骤，直接从源码树加载扩展：

```bash
# 一次性安装打包工具（@types/vscode 已作为传递依赖装好）
npm install -g @vscode/vsce

# 先编译，然后启动 VSCode 加载扩展
cd packages/vscode
yarn build                               # 产出 dist/extension.js
code --extensionDevelopmentPath=. .
```

VSCode 会以 `mddeck for VS Code` 已加载的状态启动。Output 面板
（`View → Output → mddeck`）会显示扩展错误。

### 7.3 验证 VSCode 预览钩子

在加载了扩展的 VSCode 中：

1. 打开 `examples/basic.md`
2. `Ctrl+Shift+V` 打开预览
3. 预览应展示 impress.js HTML（深色背景的幻灯片卡片，标题是 "Welcome to mddeck"）
4. 在预览窗格里按方向键 / 空格切换幻灯片

预览面板**不应该**显示原始 markdown —— 应该渲染 impress.js deck。
如果显示原始 markdown，检查：

- Output 面板中的扩展错误
- 文件 front-matter 是否包含 `theme:`（或 `marp: true` / `mddeck: true`）

---

## 8. 发布前手动冒烟测试清单

发布前走一遍下面的清单，每项都应通过：

| ✓ | 测试项 | 方法 |
|---|---|---|
| ☐ | core 编译通过 | `yarn workspace @mddeck/core build` |
| ☐ | core 测试通过（28 个） | `yarn workspace @mddeck/core test` |
| ☐ | CLI 编译通过 | `yarn workspace @mddeck/cli build` |
| ☐ | CLI 转 HTML | `node packages/cli/bin/mddeck.js examples/basic.md -o /tmp/x.html` |
| ☐ | CLI 转 PDF | `... --pdf -o /tmp/x.pdf` 然后 `file /tmp/x.pdf` |
| ☐ | CLI watch 工作 | `... --watch`，编辑 .md 验证重新构建 |
| ☐ | CLI server 工作 | `... --server --port 8080`，然后 `curl localhost:8080/basic.html` |
| ☐ | KaTeX 渲染 | `... --math katex ...`，截图 `examples/screenshots-m2/step-2.png` 验证 |
| ☐ | Emoji 渲染 | 打开 `examples/m2-features.html`，检查 `🚀 🎉 ❤️` 是否彩色 SVG |
| ☐ | XSS 已净化 | 搜索 HTML 中的 `alert(` —— 不应出现 |
| ☐ | VSCode 扩展打包 | `cd packages/vscode && vsce package` 产出 `.vsix` |
| ☐ | VSCode 预览钩子 | 用 VSCode 打开 `basic.md`，预览显示幻灯片 |

---

## 9. 常见问题

### "Could not find a Chromium executable"

CLI 找不到 Chrome 二进制。解决方案：

```bash
# 安装 chromium（Linux）
sudo pacman -S chromium          # Arch
sudo apt install chromium-browser  # Debian/Ubuntu
brew install --cask chromium      # macOS

# 或者指向已有的浏览器
export PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
```

### 数学公式显示为原始 `$x^2$`

需要安装 `katex` 包（这是可选依赖）：

```bash
# 在使用 mddeck 的项目里
yarn add katex
```

然后确保 `mddeck.config.js`（或 `--math` 参数）请求 KaTeX：

```js
module.exports = {
  mddeck: { math: 'katex' },
}
```

### VSCode 扩展预览显示原始 markdown

确保文件的 front-matter 包含以下之一：

```markdown
---
theme: default
---
```

或：

```markdown
---
mddeck: true
---
```

没有标记的话，预览会 fallback 到普通 Markdown 渲染。

### 测试报 "Cannot find module @mddeck/core"

大概率是 `node_modules` 过期了。修复：

```bash
rm -rf node_modules packages/*/node_modules
yarn install
```

### Server 模式端口已被占用

```bash
cd packages/cli
node bin/mddeck.js ../../examples/basic.md --server --port 8181
```

### Watch 模式不响应文件变化

检查 `chokidar` 是否能看到文件。如果文件在符号链接目录里，或者 Docker
挂载的 inotify 失效，watcher 就不会触发。

---

## 10. 下一步

一切就绪后：

1. **打 tag**：

   ```bash
   git tag -a v0.1.0 -m "First public release"
   ```

2. **发布到 npm**（你说要自己来，这里仅供参考）：

   ```bash
   # core 先发布（cli 依赖它）
   cd packages/core && yarn publish --access public
   # cli
   cd ../cli && yarn publish --access public
   # VSCode 扩展 → vsce marketplace
   npm install -g @vscode/vsce
   cd ../vscode && vsce publish
   ```

3. **GitHub Actions CI** —— 在 `.github/workflows/ci.yml` 里配置
   `yarn install && yarn build && yarn test`，每次 push 自动跑。

4. **CHANGELOG.md** —— 写一个 v0.1.0 条目总结 4 个里程碑。

5. **Issue 模板** —— 添加 `.github/ISSUE_TEMPLATE/{bug,feature}.md`。

祝开发愉快！
