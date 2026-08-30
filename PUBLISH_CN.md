# mddeck — 发布与上架指南（中文版）

> 一份完整的、分步骤的发布清单：准备 monorepo、发布 npm 包、
> 打包 VS Code 扩展、创建 GitHub Release。

本指南面向**维护者**。假设你拥有 [`machine-w/mddeck`](https://github.com/machine-w/mddeck)
仓库的 push 权限，并且有一个 npm 账号，对 `@mddeck/*` 命名空间有发布权限
（以及 VS Code Marketplace 上的 `mddeck` publisher）。

---

## 目录

1. [Token 安全 —— 必读](#token-安全--必读)
2. [发布前检查清单](#发布前检查清单)
3. [GitHub：打 tag + 创建 Release](#github打-tag--创建-release)
4. [npm：发布 `@mddeck/core` 和 `@mddeck/cli`](#npm发布-mddeckcore-和-mddeckcli)
5. [VS Code：打包 + 发布 `mddeck-vscode`](#vs-code打包--发布-mddeck-vscode)
6. [发布后验证](#发布后验证)
7. [回滚流程](#回滚流程)
8. [参考：package.json 字段](#参考packagejson-字段)

---

## Token 安全 —— 必读

> ⚠️ **绝对不要把真 npm token 提交到 git！** 一旦泄露，任何人都能往
> `@mddeck/*` 命名空间发布恶意代码。GitHub 会自动吊销泄露的 token，
> 但那时候损失已经造成。

仓库已经配置好了让 token 远离源码：

| 文件 / 机制 | 用途 | 是否入库？ |
|---|---|---|
| `.npmrc.template` | npm 认证模板，引用 `${NPM_TOKEN}` 环境变量 | ✅ 入库 |
| `.npmrc` | 真实的 `.npmrc`（从模板渲染） | ❌ gitignored |
| `scripts/publish.sh` | 一键发布脚本，读取 `NPM_TOKEN` 环境变量 | ✅ 入库 |
| `.github/workflows/publish.yml` | CI 发布，读取 `secrets.NPM_TOKEN` | ✅ 入库 |
| `.gitignore` | 排除 `.npmrc` 和 `*.vsix` | ✅ 入库 |

### Token 三个安全位置

| 位置 | 适用场景 | 怎么用 |
|---|---|---|
| **Shell 环境变量** | 本地一次性发布 | `export NPM_TOKEN=npm_xxxxx` 然后跑脚本 |
| **GitHub Actions Secret** | 团队通过 CI 发布 | `Settings → Secrets → Actions → New secret`，名字 `NPM_TOKEN` |
| **本地 `~/.npmrc`** | 日常本地开发 | `npm login` 自动写入；永远不要入库 |

### 推送前快速安全检查

```bash
# 确认没有 token 漏到被跟踪的文件里
git ls-files | xargs grep -lE 'npm_[A-Za-z0-9]{20,}' 2>/dev/null
# → （无输出 = OK）

# 或用 ripgrep
rg 'npm_[A-Za-z0-9]{20,}' $(git ls-files)
# → （无输出 = OK）
```

万一 token 泄露了：**立刻到 <https://www.npmjs.com/settings/~/tokens> 吊销它**，
然后生成新的。

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
grep -rn "console.log\|debugger\|TODO" packages/*/src
```

### Git 卫生

```bash
git status                          # 工作区干净
git fetch origin && git status       # main 分支与 origin 同步
git status --short                  # 没有未提交的变更
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
git checkout main
git pull origin main
git tag -a v0.1.0 -m "mddeck v0.1.0 — 首次公开发布"
git push origin v0.1.0
```

### 2. 创建 GitHub Release

用 GitHub CLI 一键创建带说明的 release：

```bash
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

## npm：发布 `@mddeck/core` 和 `@mddeck/cli`

`@mddeck/core` 是**基础** —— 必须先发，因为 `@mddeck/cli` 依赖它。
（`mddeck-vscode` 依赖 `@mddeck/cli`，所以应该在 CLI 上 npm **之后**再发布。）

有**三种发布方式**，挑一种：

### 方案 A：一键脚本（推荐用于本地发布）

仓库自带 `scripts/publish.sh`，它会：
1. 从环境变量读 `NPM_TOKEN`
2. 把 `.npmrc.template` 渲染成 `.npmrc`（gitignored, `chmod 600`）
3. 校验工作区干净、测试通过、版本一致
4. 编译所有包
5. 发布 `@mddeck/core`，再发 `@mddeck/cli`
6. 退出时自动清理 `.npmrc`

```bash
# 方式 1：内联
NPM_TOKEN="npm_xxxxxxxxxxxxx" bash scripts/publish.sh

# 方式 2：先 export
export NPM_TOKEN="npm_xxxxxxxxxxxxx"
yarn publish:all          # 同样调用 scripts/publish.sh

# Dry-run（不真发布，只看会发生什么）
DRY_RUN=1 NPM_TOKEN="npm_xxxxxxxxxxxxx" bash scripts/publish.sh
```

脚本会**快速失败**于：
- 工作区有未提交的变更
- 任何测试失败
- 3 个包的版本不一致
- `yarn build` 失败

> **Token 安全**：脚本把 `.npmrc` 写到磁盘（gitignored, `chmod 600`），
> 退出时清理。Token **只**从 `NPM_TOKEN` 环境变量读 —— 绝不会写到
> `.npmrc` 之外的任何地方。

### 方案 B：GitHub Actions（推荐团队发布）

仓库自带 `.github/workflows/publish.yml` —— 一个手动 workflow，
使用 GitHub Secrets 里的 token 发布到 npm。这是**对团队最安全**的方式。

**一次性配置**：

1. 在 <https://www.npmjs.com/settings/~/tokens> 生成 npm token，勾选
   `@mddeck` 命名空间的 publish 权限（类型选 **Automation**）
2. 打开 GitHub 仓库 → **Settings** → **Secrets and variables**
   → **Actions** → **New repository secret**
3. Name: `NPM_TOKEN`，Value: 粘贴 token

**每次发布**：

1. 打开 GitHub 仓库 → **Actions** → **Publish** → **Run workflow**
2. 填入版本号（如 `0.1.0`），可选勾选 "Dry run"
3. Workflow 会：
   - 校验 3 个 package.json 版本号都匹配输入
   - 跑测试
   - 编译所有包
   - 用 **provenance** 发布 `@mddeck/core` 然后 `@mddeck/cli`
   - 在 Summary 里贴出 npm 链接

Token 永远不会出现在日志或仓库源码里 —— 它只在 GitHub 加密的 secret
存储里。

### 方案 C：手动（需要完全控制时）

```bash
# 1. 登录（一次性，用 token）
npm login --auth-type=legacy
# （或者：echo "$NPM_TOKEN" | npm login --auth-type=legacy --stdin）

# 2. 确认有发布权限
npm whoami
npm access ls-packages @mddeck/core    # 应显示你的用户名

# 3. 把 packages/cli/package.json 里的 @mddeck/core 依赖
#    从 "file:../core" 改成 "^0.1.0"（或你正在发的版本）
cd packages/cli
npm pkg set 'dependencies.@mddeck/core'='^0.1.0'
cd ../..

# 4. 编译 + dry-run
yarn build
cd packages/core
npm publish --dry-run --provenance
cd ../cli
npm publish --dry-run --provenance

# 5. 发布（按顺序：core 先，cli 后）
cd packages/core
npm publish --access public --provenance
cd ../cli
npm publish --access public --provenance
```

`--access public` 是 scoped 包（`@mddeck/*`）首次发布必需的选项。
`--provenance` 附加一个证明该包是从此 commit 构建的 attestation
（CI 里需要 `id-token: write` 权限，本地跑不需要）。

### 验证

```bash
# 检查包已上 npm
npm view @mddeck/core
npm view @mddeck/cli

# 在干净目录装一下确认能用
mkdir /tmp/verify-npm && cd /tmp/verify-npm
npm init -y
npm install @mddeck/core @mddeck/cli
node -e "const { MdDeck } = require('@mddeck/core'); console.log(new MdDeck().render('# Hi').html.slice(0, 60))"
# → 应打印带 <div class="step"> 的 HTML

# CLI 也试一下
npx mddeck /path/to/some.md -o /tmp/from-npm.html
```

---

## VS Code：打包 + 发布 `mddeck-vscode`

`mddeck-vscode` 依赖 `@mddeck/cli`（传递依赖 `@mddeck/core`），所以**先要把
那两个包发到 npm 再做这个**。

### 前提

```bash
npm install -g @vscode/vsce

# 在 https://marketplace.visualstudio.com/ 创建 publisher 账号
# （用 Microsoft / GitHub 账号，注册名为 "mddeck" 的 publisher）

# 用 vsce 登录 publisher
vsce login mddeck
# （vsce 会提示输入 Personal Access Token，从
#  https://dev.azure.com → Security → PATs 创建，scope 选 "Marketplace — Manage"）
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
npm install -g ovsx

# 在 https://open-vsx.org → 你的账号 → settings 获取 token
ovsx login <your-token>

ovsx publish mddeck-vscode-0.1.0.vsix -p mddeck
```

---

## 发布后验证

发布完成后，跑**跨渠道冒烟测试**：

```bash
# 1. 验证 core + cli from npm
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

# 打 tag + 发布（三选一）
git tag -a v0.1.1 -m "修复 ..."
git push origin v0.1.1
NPM_TOKEN="..." yarn publish:all
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
发布前
□ yarn build                                            (干净编译)
□ yarn test                                             (41 个测试通过)
□ 在 3 个 package.json 里升级版本号                     (semver)
□ 更新 CHANGELOG.md                                     (一条新记录)
□ Token 没漏：rg 'npm_[A-Za-z0-9]{20,}' $(git ls-files)

Git
□ git commit -am "Release v0.1.0"
□ git tag -a v0.1.0 -m "..." && git push origin v0.1.0
□ gh release create v0.1.0 --notes-file ...

npm（三选一）
□ A) 本地：  NPM_TOKEN="npm_..." yarn publish:all
□ B) CI：    在 GitHub Secrets 设 NPM_TOKEN → 跑 workflow
□ C) 手动：  cd packages/core && npm publish --access public --provenance
            cd packages/cli  && npm publish --access public --provenance

VSCode
□ npm install -g @vscode/vsce && vsce login mddeck
□ cd packages/vscode && yarn build
□ vsce package
□ vsce publish

验证
□ npm view @mddeck/core
□ npm view @mddeck/cli
□ npx mddeck examples/basic.md -o /tmp/x.html    (浏览器打开)
□ npx mddeck examples/basic.md --pdf -o /tmp/x.pdf
□ code --install-extension packages/vscode/mddeck-vscode-*.vsix
```

完事，开船。
