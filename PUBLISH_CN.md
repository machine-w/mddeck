# mddeck — 发布与上架指南（中文版）

> 一份完整的、分步骤的发布清单：准备 monorepo、发布 npm 包、
> 打包 VS Code 扩展、创建 GitHub Release。

本指南面向**维护者**。假设你拥有 [`machine-w/mddeck`](https://github.com/machine-w/mddeck)
仓库的 push 权限，并且有一个 npm 账号，对 `@mddeck/*` 命名空间有发布权限
（以及 VS Code Marketplace 上的 `mddeck` publisher）。

---

## 目录

1. [发布前检查清单](#发布前检查清单)
2. [GitHub：打 tag + 创建 Release](#github打-tag--创建-release)
3. [npm：发布 `@mddeck/core`](#npm发布-mddeckcore)
4. [npm：发布 `@mddeck/cli`](#npm发布-mddeckcli)
5. [VS Code：打包 + 发布 `mddeck-vscode`](#vs-code打包--发布-mddeck-vscode)
6. [发布后验证](#发布后验证)
7. [回滚流程](#回滚流程)
8. [参考：package.json 字段](#参考packagejson-字段)

---

## 发布前检查清单

在开始打 tag 或发布**之前**，把每一项都过一遍。这些操作都没破坏性，但
跳过任何一项通常会导致发布版本出问题。

### 代码质量

```bash
# 所有包都能干净地编译
yarn build

# 41 个单元测试全部通过
yarn test

# 生产代码中没有遗留的 console.log / debugger / TODO
# （跑 `grep -rn "console.log\|debugger\|TODO" packages/*/src` 审查）
```

### Git 卫生

```bash
# 工作区干净
git status

# main 分支与 origin 同步
git fetch origin
git status   # 应该显示 "Your branch is up to date"

# 没有未提交的变更 / 未跟踪的文件
git status --short
```

### 版本号升级

在 **3 个位置**升级版本号（我们还没用 monorepo 工具，所以是手动的）：

```bash
# 编辑这些文件：
#   packages/core/package.json    → "version": "X.Y.Z"
#   packages/cli/package.json     → "version": "X.Y.Z"
#   packages/vscode/package.json  → "version": "X.Y.Z"
#   CHANGELOG.md                  → 顶部新加一条
```

SemVer 规则：

- **MAJOR** (X.0.0) —— 破坏性 API 变更（重命名的 directive、删除的 CLI 参数、
  改动的 `MdDeck` 构造签名）
- **MINOR** (0.Y.0) —— 新功能（新 directive、新 CLI 参数、新主题）。向后兼容。
- **PATCH** (0.0.Z) —— bug 修复、文档笔误、依赖更新。API 不变。

### 最终冒烟测试

从 [`DEV.md`](./DEV.md) 第 8 节的清单，确保所有 12 项都通过。特别注意：

- [ ] `node packages/cli/bin/mddeck.js examples/basic.md -o /tmp/x.html` — 能用
- [ ] `... --pdf -o /tmp/x.pdf` — 生成有效 PDF
- [ ] `... --math katex ...` — 截图里能渲染数学
- [ ] KaTeX 数学显示为彩色公式（对比 `examples/screenshots-m2/step-2.png`）
- [ ] Emoji 显示为 twemoji SVG（对比 `examples/screenshots-m2/step-3.png`）
- [ ] XSS 已净化（在 `/tmp/x.html` 中搜索 `alert(` —— 应该是 0 处）

---

## GitHub：打 tag + 创建 Release

仓库的 GitHub Releases 是唯一可信来源 —— npm 和 VS Code Marketplace
都反向链接到这里的 tag。

### 1. 打 tag

```bash
# 确保 main 分支干净且最新
git checkout main
git pull origin main

# 创建 annotated tag
git tag -a v0.1.0 -m "mddeck v0.1.0 — 首次公开发布"

# 推送 tag
git push origin v0.1.0
```

### 2. 创建 GitHub Release

用 GitHub CLI 一键创建带说明的 release：

```bash
# 准备发布说明 —— 从 CHANGELOG.md 复制
gh release create v0.1.0 \
  --title "mddeck v0.1.0" \
  --notes-file /tmp/release-notes.md \
  --target main
```

Release 正文用这个模板（填入空白）：

```markdown
## mddeck v0.1.0

首次公开发布。

### 亮点

- **`@mddeck/core` v0.1.0** —— markdown → impress.js 渲染库
- **`@mddeck/cli` v0.1.0** —— `mddeck` 命令，支持 HTML / PDF / watch / server
- **`mddeck-vscode` v0.1.0** —— VS Code 扩展，编辑器内实时预览

### 功能

- 基于 [impress.js](https://impress.js) 的 3D 幻灯片转场
- KaTeX 数学公式渲染（行内 + 块级）
- Twemoji 支持 `:shortcode:` 和 unicode emoji
- XSS 安全的 HTML 净化
- 3 个内置主题（default / gaia / uncover）+ 自定义主题支持
- CLI 特性：HTML 输出、PDF 导出、watch 模式、HTTP server
- 41 个单元测试，全部通过

### 安装

\`\`\`bash
npm install --save-dev @mddeck/cli
# 或用 npx
npx @mddeck/cli presentation.md -o slides.html
\`\`\`

### 完整更新日志

见 [CHANGELOG.md](./CHANGELOG.md)。
```

创建 release 后，复制它的 markdown URL，用于 npm 包描述和 VS Code 扩展页面。

---

## npm：发布 `@mddeck/core`

`@mddeck/core` 是**基础** —— 必须先发，因为 `@mddeck/cli` 和
`mddeck-vscode` 都依赖它。

### 发布前

```bash
# 确认已登录
npm login                              # 输入 npm 凭据

# 确认 npm 账号对 @mddeck/* 有发布权限
npm whoami
npm access ls-packages @mddeck/core    # 应显示你的用户名
```

### 先 dry-run

```bash
cd packages/core

# 确保 dist/ 是最新的
yarn build

# dry-run：查看将要发布的内容（不上传）
npm publish --dry-run

# 预期输出：
#   npm notice
#   package: @mddeck/core@0.1.0
#   === Tarball Contents ===
#   ... dist/ 文件 ...
#   === npm Config ===
#   ...
```

### 发布

```bash
cd packages/core
npm publish --access public
```

`--access public` 是 scoped 包（`@mddeck/*`）首次发布必需的选项。后续发布
不需要加。

预期输出：

```
+ @mddeck/core@0.1.0
```

### 验证

```bash
# 检查包已上 npm
npm view @mddeck/core

# 在干净目录里装一下确认能用
mkdir /tmp/verify-core && cd /tmp/verify-core
npm init -y
npm install @mddeck/core
node -e "const { MdDeck } = require('@mddeck/core'); console.log(new MdDeck().render('# Hi').html)"
# → 应打印带 <div class="step"> 的 HTML
```

---

## npm：发布 `@mddeck/cli`

`@mddeck/cli` 依赖 `@mddeck/core`。先发 core，再发 CLI。

### 发布前

```bash
cd packages/cli

# 把 package.json 里的依赖更新为刚发布的版本（当前是 file:../core）。改成：
#   "@mddeck/core": "^0.1.0"
# （或你刚发的任何版本）
```

或者用 `npm pkg set`：

```bash
npm pkg set 'dependencies.@mddeck/core'='^0.1.0'
```

### dry-run

```bash
cd packages/cli
yarn build
npm publish --dry-run
```

### 发布

```bash
cd packages/cli
npm publish --access public
```

### 验证

```bash
mkdir /tmp/verify-cli && cd /tmp/verify-cli
npm install @mddeck/cli

# 构建示例 deck
node node_modules/.bin/mddeck /path/to/some.md -o /tmp/out.html

# watch 模式
node node_modules/.bin/mddeck /path/to/some.md --watch -o /tmp/out.html

# server 模式（浏览器打开 localhost:8080）
node node_modules/.bin/mddeck /path/to/some.md --server
```

---

## VS Code：打包 + 发布 `mddeck-vscode`

VS Code 扩展通过 `vsce` 工具发布到 **Visual Studio Marketplace** 和
**Open VSX Registry**。

### 前提

```bash
# 一次性安装 vsce
npm install -g @vscode/vsce

# 在 https://marketplace.visualstudio.com/ 创建 publisher 账号
# （用 Microsoft / GitHub 账号，然后注册名为 "mddeck" 的 publisher）

# 用 vsce 登录 publisher
vsce login mddeck
# （vsce 会提示输入 Personal Access Token，从
#  https://dev.azure.com → Security → PATs 创建，scope 选 "Marketplace"）
```

### 打包 `.vsix`

```bash
cd packages/vscode
yarn build

# 创建 .vsix 压缩包（就是要发布的）
vsce package
# → packages/vscode/mddeck-vscode-0.1.0.vsix
```

### 发布到 VS Code Marketplace

```bash
cd packages/vscode
vsce publish
# → "Extension mddeck-vscode published to VS Code Marketplace"
```

大约 5 分钟后，扩展可以在 <https://marketplace.visualstudio.com/items?itemName=mddeck.mddeck-vscode> 搜索到。

### （可选）发布到 Open VSX Registry

Open VSX 是开源替代品，被部分编辑器使用（Eclipse Theia、Gitpod 等）：

```bash
# 安装 ovsx
npm install -g ovsx

# 用 Open VSX token 登录
# 在 https://open-vsx.org → 你的账号 → settings 获取 token
ovsx login <your-token>

# 发布
ovsx publish mddeck-vscode-0.1.0.vsix -p mddeck
```

---

## 发布后验证

发布完成后，跑**跨渠道冒烟测试**：

```bash
# 1. 验证 core from npm
mkdir /tmp/verify-all && cd /tmp/verify-all
npm init -y
npm install @mddeck/core @mddeck/cli
node -e "const { MdDeck } = require('@mddeck/core'); console.log(new MdDeck().render('# Hi').html.slice(0, 60))"

# 2. 验证 CLI from npm（用安装的 @mddeck/core，不是本地的）
npx mddeck examples/basic.md -o /tmp/from-npm.html
xdg-open /tmp/from-npm.html

# 3. CLI PDF
npx mddeck examples/basic.md --pdf -o /tmp/from-npm.pdf
file /tmp/from-npm.pdf    # → PDF document, version 1.4, 7 page(s)

# 4. VS Code 扩展
# （手动：在全新的 VS Code profile 里装 .vsix，验证
#  Markdown 预览能渲染 impress.js deck）
code --install-extension packages/vscode/mddeck-vscode-0.1.0.vsix
```

在 GitHub release 里更新确认信息：三个渠道都工作。

---

## 回滚流程

如果发布出问题，根据严重程度有三个选项：

### 选项 1：unpublish 单个版本（72 小时内）

```bash
npm unpublish @mddeck/core@0.1.0 --force
npm unpublish @mddeck/cli@0.1.0 --force
```

**警告**：npm 只允许在发布后 72 小时内 unpublish，并且**强烈不推荐**这么做，
因为它会破坏已安装该版本的所有用户。仅在真正破损的发布（比如意外泄露密钥）
时使用。

### 选项 2：发布 patch（推荐）

如果是小 bug，修复并发布 patch：

```bash
# 修复 bug
# 升级版本：0.1.0 → 0.1.1
# 在 packages/core/package.json、packages/cli/package.json、
#    packages/vscode/package.json
# 重新编译 + 测试
yarn build && yarn test

# 打 tag + 发布
git tag -a v0.1.1 -m "修复 ..."
git push origin v0.1.1
npm publish                                  # (在每个包目录)
vsce publish                                 # (在 vscode 目录)
gh release create v0.1.1 --title "..." --notes "..."
```

### 选项 3：deprecate 版本（安全的中间方案）

如果想阻止新装但保留给已装的用户：

```bash
npm deprecate @mddeck/core@0.1.0 "严重 bug，请升级到 0.1.1"
npm deprecate @mddeck/cli@0.1.0 "严重 bug，请升级到 0.1.1"
```

VS Code 端，从 Marketplace 后台取消发布：
<https://marketplace.visualstudio.com/manage>。

---

## 参考：package.json 字段

### 公共字段（所有包）

| 字段 | 值 | 用途 |
|---|---|---|
| `name` | `@mddeck/core`、`@mddeck/cli`、`mddeck-vscode` | npm 包名（注意 vscode 没有 scope） |
| `version` | `X.Y.Z` | SemVer 版本；3 个包必须一致 |
| `license` | `MIT` | SPDX 协议标识符 |
| `repository.type` | `"git"` | |
| `repository.url` | `"git+https://github.com/machine-w/mddeck.git"` | |
| `bugs.url` | `"https://github.com/machine-w/mddeck/issues"` | |
| `homepage` | `"https://github.com/machine-w/mddeck#readme"` | npm 页面链接 |
| `engines.node` | `">=18"` | Node 版本要求 |

### `@mddeck/core` 的 `package.json`

```json
{
  "name": "@mddeck/core",
  "version": "0.1.0",
  "description": "Markdown → impress.js slide deck core (parser + theme + directives)",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./katex": { "import": "./dist/plugins_katex/index.js" },
    "./browser": { "import": "./dist/browser.js" }
  },
  "files": ["dist/"],
  "dependencies": {
    "@marp-team/marpit": "^3.2.2",
    "js-yaml": "^4.1.0",
    "markdown-it": "^14.1.0",
    "postcss": "^8.5.26"
  }
}
```

### `@mddeck/cli` 的 `package.json`

```json
{
  "name": "@mddeck/cli",
  "version": "0.1.0",
  "bin": { "mddeck": "./bin/mddeck.js" },
  "dependencies": {
    "@mddeck/core": "^0.1.0",          // ← 发布时改成 ^X.Y.Z
    "chokidar": "^3.6.0",
    "cosmiconfig": "^9.0.2",
    "express": "^4.21.0",
    "puppeteer-core": "^22.0.0",
    "serve-index": "^1.9.2",
    "ws": "^8.18.0",
    "yargs": "^17.7.2"
  }
}
```

### `mddeck-vscode` 的 `package.json`

```json
{
  "name": "mddeck-vscode",
  "displayName": "mddeck for VS Code",
  "publisher": "mddeck",
  "version": "0.1.0",
  "main": "./dist/extension.js",
  "engines": { "vscode": "^1.85.0" },
  "dependencies": {
    "@mddeck/cli": "^0.1.0"           // ← 发布时改成 ^X.Y.Z
  }
}
```

---

## 速查：一页式清单

```text
□ yarn build                                            (干净编译)
□ yarn test                                             (41 个测试通过)
□ 在 3 个 package.json 里升级版本号                     (semver)
□ 更新 CHANGELOG.md                                     (一条新记录)
□ git commit -am "Release v0.1.0"
□ git tag -a v0.1.0 -m "..."                            (推送 tag)
□ npm publish (在 packages/core/)                      (--dry-run 先)
□ npm publish (在 packages/cli/)                       (core 之后)
□ vsce package + vsce publish (在 packages/vscode/)
□ gh release create v0.1.0 --notes-file ...            (带 changelog)
□ 在干净目录验证：npm install + 跑 CLI + PDF
□ 在全新 VS Code profile 装 .vsix，测试预览
□ 更新 CHANGELOG.md 加 "Released on YYYY-MM-DD" 链接
```

完事，开船。
