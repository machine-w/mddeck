# mddeck — Release & Publishing Guide

> A complete, step-by-step checklist for cutting a release of mddeck:
> preparing the monorepo, publishing the npm packages, packaging the
> VS Code extension, and creating a GitHub release with notes.

This guide is for the **maintainer**. It assumes you have push access
to the [`machine-w/mddeck`](https://github.com/machine-w/mddeck) repo
and an npm account with publish rights to the `@mddeck/*` scope (and
the `mddeck-vscode` publisher on the VS Code Marketplace).

---

## Table of contents

1. [Pre-release checklist](#pre-release-checklist)
2. [GitHub: tag & release](#github-tag--release)
3. [npm: publish `@mddeck/core`](#npm-publish-mddeckcore)
4. [npm: publish `@mddeck/cli`](#npm-publish-mddeckcli)
5. [VS Code: package & publish `mddeck-vscode`](#vs-code-package--publish-mddeck-vscode)
6. [Post-release verification](#post-release-verification)
7. [Rollback procedure](#rollback-procedure)
8. [Reference: package.json fields](#reference-packagejson-fields)

---

## Pre-release checklist

Run through every item **before** you start tagging or publishing.
Nothing here is destructive, but skipping an item usually means a broken
release downstream.

### Code quality

```bash
# All packages compile cleanly
yarn build

# All 41 unit tests pass
yarn test

# No leftover console.log / debugger / TODO in production code
# (run `grep -rn "console.log\|debugger\|TODO" packages/*/src` and review)
```

### Git hygiene

```bash
# Working tree is clean
git status

# main is current with origin
git fetch origin
git status   # should say "Your branch is up to date"

# No uncommitted changes / untracked files
git status --short
```

### Version bumping

Bump the version in **3 places** (we don't use a monorepo version tool
yet, so this is manual):

```bash
# Edit these files:
#   packages/core/package.json    → "version": "X.Y.Z"
#   packages/cli/package.json     → "version": "X.Y.Z"
#   packages/vscode/package.json  → "version": "X.Y.Z"
#   CHANGELOG.md                  → new entry at top
```

SemVer rules:

- **MAJOR** (X.0.0) — breaking API changes (renamed directives, removed
  CLI flags, changed `MdDeck` constructor signature)
- **MINOR** (0.Y.0) — new features (new directive, new CLI flag, new
  theme). Backward compatible.
- **PATCH** (0.0.Z) — bug fixes, doc typos, dependency updates. No API
  surface change.

### Final smoke test

From [`DEV.md`](./DEV.md) section 8 (smoke test checklist), make sure all
12 boxes are checked. In particular:

- [ ] `node packages/cli/bin/mddeck.js examples/basic.md -o /tmp/x.html` — works
- [ ] `... --pdf -o /tmp/x.pdf` — produces a valid PDF
- [ ] `... --math katex ...` — renders math in screenshots
- [ ] KaTeX math shows colored formulas (compare with `examples/screenshots-m2/step-2.png`)
- [ ] Emoji shows as twemoji SVG (compare with `examples/screenshots-m2/step-3.png`)
- [ ] XSS is sanitized (search `/tmp/x.html` for `alert(` — should be 0 hits)

---

## GitHub: tag & release

The repo's GitHub Releases are the source of truth — npm and VS Code
Marketplace both link back to a tag in this repo.

### 1. Tag the release

```bash
# Make sure main is clean and current
git checkout main
git pull origin main

# Create an annotated tag
git tag -a v0.1.0 -m "mddeck v0.1.0 — first public release"

# Push the tag
git push origin v0.1.0
```

### 2. Create a GitHub release

Use the GitHub CLI for a one-shot release with notes:

```bash
# Draft release notes — copy from CHANGELOG.md
gh release create v0.1.0 \
  --title "mddeck v0.1.0" \
  --notes-file /tmp/release-notes.md \
  --target main
```

The release body should follow this template (fill in the blanks):

```markdown
## mddeck v0.1.0

First public release.

### Highlights

- **`@mddeck/core` v0.1.0** — markdown → impress.js rendering library
- **`@mddeck/cli` v0.1.0** — `mddeck` command for HTML / PDF / watch / server
- **`mddeck-vscode` v0.1.0** — VS Code extension with live preview

### What's included

- 3D slide transitions powered by [impress.js](https://impress.js)
- KaTeX math rendering (inline + block)
- Twemoji for `:shortcode:` and unicode emoji
- XSS-safe HTML sanitization
- 3 built-in themes (default / gaia / uncover) + custom theme support
- CLI features: HTML output, PDF export, watch mode, HTTP server
- 41 unit tests, all passing

### Installation

\`\`\`bash
npm install --save-dev @mddeck/cli
# or use npx
npx @mddeck/cli presentation.md -o slides.html
\`\`\`

### Full changelog

See [CHANGELOG.md](./CHANGELOG.md).
```

After creating the release, copy its markdown URL for use in the npm
package descriptions and the VS Code extension page.

---

## npm: publish `@mddeck/core`

`@mddeck/core` is the **foundation** — publish it first, because
`@mddeck/cli` and `mddeck-vscode` depend on it.

There are **two ways** to publish. Pick one:

### Option A: one-shot script (recommended for local publishing)

The repo includes `scripts/publish.sh` which:
1. Reads `NPM_TOKEN` from the environment
2. Renders `.npmrc.template` → `.npmrc` (gitignored)
3. Verifies working tree is clean, tests pass, versions match
4. Builds everything
5. Publishes `@mddeck/core`, then `@mddeck/cli`
6. Prints the npm URLs for follow-up

```bash
# Either set it inline:
NPM_TOKEN="npm_xxxxxxxxxxxxx" bash scripts/publish.sh

# Or export first (the script will pick it up):
export NPM_TOKEN="npm_xxxxxxxxxxxxx"
yarn publish:all

# Dry run (no actual publish):
DRY_RUN=1 NPM_TOKEN="npm_xxxxxxxxxxxxx" bash scripts/publish.sh
```

The script will fail-fast if:
- Working tree has uncommitted changes
- Any test fails
- The 3 packages have mismatched versions
- `yarn build` fails

> **Token safety**: the script writes `.npmrc` to disk (gitignored) with
> `chmod 600`. **Never** put a real token in any committed file.

### Option B: manual (when you want fine-grained control)

```bash
# Ensure you're logged in
npm login                              # enter your npm credentials
# OR use a token without logging in:
# echo "npm_xxxxxxxxxxxxx" | npm login --auth-type=legacy

# Verify your npm account has publish rights to @mddeck/*
npm whoami
npm access ls-packages @mddeck/core    # should show your username
```

```bash
cd packages/core

# Make sure dist/ is up to date
yarn build

# Dry-run: see what would be published WITHOUT actually uploading
npm publish --dry-run --provenance
```

Then publish:

```bash
cd packages/core
npm publish --access public --provenance
```

`--access public` is required for the first publish of a scoped package
(`@mddeck/*`). `--provenance` attaches an attestation that the package
was built from this specific commit (requires `id-token: write`
permission in CI).

### Option C: GitHub Actions (recommended for CI-driven releases)

The repo includes `.github/workflows/publish.yml`. To use it:

1. Add your npm token to GitHub repo secrets as `NPM_TOKEN`
   (`Settings → Secrets and variables → Actions → New repository secret`)
2. Go to `Actions → Publish → Run workflow`
3. Enter the version number and optionally check "dry run"
4. The workflow verifies versions, runs tests, builds, then publishes

This is the safest option for teams — the token never leaves GitHub's
secret store.

### Verify

```bash
# Check the package is on npm
npm view @mddeck/core

# Install in a clean directory to confirm it works
mkdir /tmp/verify-core && cd /tmp/verify-core
npm init -y
npm install @mddeck/core
node -e "const { MdDeck } = require('@mddeck/core'); console.log(new MdDeck().render('# Hi').html)"
# → should print HTML with <div class="step">
```

---

## npm: publish `@mddeck/cli`

`@mddeck/cli` depends on `@mddeck/core`. Publish core first, then CLI.

### Pre-flight

```bash
cd packages/cli

# Update the dependency in package.json to point at the just-published
# version (currently uses file:../core). Change to:
#   "@mddeck/core": "^0.1.0"
# (or whichever version you just published)
```

Alternatively, use `npm pkg set`:

```bash
npm pkg set 'dependencies.@mddeck/core'='^0.1.0'
```

### Dry-run

```bash
cd packages/cli
yarn build
npm publish --dry-run
```

### Publish

```bash
cd packages/cli
npm publish --access public
```

### Verify

```bash
mkdir /tmp/verify-cli && cd /tmp/verify-cli
npm install @mddeck/cli

# Build the example deck
node node_modules/.bin/mddeck /path/to/some.md -o /tmp/out.html

# Watch mode
node node_modules/.bin/mddeck /path/to/some.md --watch -o /tmp/out.html

# Server mode (open browser to localhost:8080)
node node_modules/.bin/mddeck /path/to/some.md --server
```

---

## VS Code: package & publish `mddeck-vscode`

The VS Code extension is published to the **Visual Studio Marketplace**
and **Open VSX Registry** via the `vsce` tool.

### Prerequisites

```bash
# Install vsce once
npm install -g @vscode/vsce

# Create a publisher account on https://marketplace.visualstudio.com/
# (Microsoft / GitHub account, then register a publisher named "mddeck")

# Login vsce to your publisher
vsce login mddeck
# (vsce will prompt for a Personal Access Token from
#  https://dev.azure.com → Security → PATs, with scope "Marketplace")
```

### Package the `.vsix`

```bash
cd packages/vscode
yarn build

# Create the .vsix archive (this is what you'll publish)
vsce package
# → packages/vscode/mddeck-vscode-0.1.0.vsix
```

### Publish to the VS Code Marketplace

```bash
cd packages/vscode
vsce publish
# → "Extension mddeck-vscode published to VS Code Marketplace"
```

The extension becomes discoverable within ~5 minutes at
<https://marketplace.visualstudio.com/items?itemName=mddeck.mddeck-vscode>.

### (Optional) Publish to Open VSX Registry

Open VSX is the open-source alternative used by some editors
(Eclipse Theia, Gitpod, etc.):

```bash
# Install ovsx
npm install -g ovsx

# Login with an Open VSX token
# Get a token at https://open-vsx.org → your account → settings
ovsx login <your-token>

# Publish
ovsx publish mddeck-vscode-0.1.0.vsix -p mddeck
```

---

## Post-release verification

After publishing, run the **cross-channel smoke test**:

```bash
# 1. Core from npm
mkdir /tmp/verify-all && cd /tmp/verify-all
npm init -y
npm install @mddeck/core @mddeck/cli
node -e "const { MdDeck } = require('@mddeck/core'); console.log(new MdDeck().render('# Hi').html.slice(0, 60))"

# 2. CLI from npm (uses the installed @mddeck/core, not the local one)
npx mddeck examples/basic.md -o /tmp/from-npm.html
xdg-open /tmp/from-npm.html

# 3. CLI PDF
npx mddeck examples/basic.md --pdf -o /tmp/from-npm.pdf
file /tmp/from-npm.pdf    # → PDF document, version 1.4, 7 page(s)

# 4. VS Code extension
# (manual: install the .vsix in a fresh VS Code profile and verify
#  Markdown preview renders the impress.js deck)
code --install-extension packages/vscode/mddeck-vscode-0.1.0.vsix
```

Update your release notes on GitHub with confirmation that all three
channels work.

---

## Rollback procedure

If a release is broken, you have three options depending on severity:

### Option 1: unpublish a single version (within 72 hours)

```bash
npm unpublish @mddeck/core@0.1.0 --force
npm unpublish @mddeck/cli@0.1.0 --force
```

**Warning**: npm only allows unpublishing within 72 hours of release, and
**strongly discourages** it because it breaks anyone who installed the
version. Use this only for truly broken releases (e.g. accidental
secret leak).

### Option 2: publish a patch (preferred)

If the bug is minor, fix it and release a patch:

```bash
# Fix the bug
# Bump version: 0.1.0 → 0.1.1
# In packages/core/package.json, packages/cli/package.json,
#    packages/vscode/package.json
# Rebuild + test
yarn build && yarn test

# Tag + publish
git tag -a v0.1.1 -m "Fix ..."
git push origin v0.1.1
npm publish                                  # (in each package dir)
vsce publish                                 # (in vscode dir)
gh release create v0.1.1 --title "..." --notes "..."
```

### Option 3: deprecate the version (safe middle ground)

If you want to discourage new installs but keep it for existing users:

```bash
npm deprecate @mddeck/core@0.1.0 "Critical bug, please upgrade to 0.1.1"
npm deprecate @mddeck/cli@0.1.0 "Critical bug, please upgrade to 0.1.1"
```

For VS Code, unpublish via the Marketplace UI:
<https://marketplace.visualstudio.com/manage>.

---

## Reference: package.json fields

### Common fields (all packages)

| Field | Value | Purpose |
|---|---|---|
| `name` | `@mddeck/core`, `@mddeck/cli`, `mddeck-vscode` | npm package name (note vscode has no scope) |
| `version` | `X.Y.Z` | SemVer version; must match across all 3 packages |
| `license` | `MIT` | SPDX license identifier |
| `repository.type` | `"git"` | |
| `repository.url` | `"git+https://github.com/machine-w/mddeck.git"` | |
| `bugs.url` | `"https://github.com/machine-w/mddeck/issues"` | |
| `homepage` | `"https://github.com/machine-w/mddeck#readme"` | npm page link |
| `engines.node` | `">=18"` | Node version requirement |

### `package.json` for `@mddeck/core`

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

### `package.json` for `@mddeck/cli`

```json
{
  "name": "@mddeck/cli",
  "version": "0.1.0",
  "bin": { "mddeck": "./bin/mddeck.js" },
  "dependencies": {
    "@mddeck/core": "^0.1.0",          // ← bumped to ^X.Y.Z at release
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

### `package.json` for `mddeck-vscode`

```json
{
  "name": "mddeck-vscode",
  "displayName": "mddeck for VS Code",
  "publisher": "mddeck",
  "version": "0.1.0",
  "main": "./dist/extension.js",
  "engines": { "vscode": "^1.85.0" },
  "dependencies": {
    "@mddeck/cli": "^0.1.0"           // ← bumped to ^X.Y.Z at release
  }
}
```

---

## Quick reference: one-page checklist

```text
□ yarn build                                            (clean build)
□ yarn test                                             (41 tests pass)
□ Bump version in 3 package.json files                 (semver)
□ Update CHANGELOG.md                                   (one entry)
□ git commit -am "Release v0.1.0"
□ git tag -a v0.1.0 -m "..."                            (push tag)
□ npm publish (in packages/core/)                      (--dry-run first)
□ npm publish (in packages/cli/)                       (after core)
□ vsce package + vsce publish (in packages/vscode/)
□ gh release create v0.1.0 --notes-file ...            (with changelog)
□ Verify in fresh dir: npm install + run CLI + PDF
□ Install .vsix in fresh VS Code profile, test preview
□ Update CHANGELOG.md with "Released on YYYY-MM-DD" link
```

That's it. Ship it.
