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

1. [Token safety — read this first](#token-safety--read-this-first)
2. [Pre-release checklist](#pre-release-checklist)
3. [GitHub: tag & release](#github-tag--release)
4. [npm: publish `@mddeck/core` & `@mddeck/cli`](#npm-publish-mddeckcore--mddeckcli)
5. [VS Code: package & publish `mddeck-vscode`](#vs-code-package--publish-mddeck-vscode)
6. [Post-release verification](#post-release-verification)
7. [Rollback procedure](#rollback-procedure)
8. [Reference: package.json fields](#reference-packagejson-fields)

---

## Token safety — read this first

> ⚠️ **NEVER commit a real npm token to git.** If it leaks, anyone can
> publish malicious code to the `@mddeck/*` scope. GitHub will auto-revoke
> leaked tokens, but only after the damage is done.

The repo is configured to keep tokens out of source control:

| File / mechanism | Purpose | Committed? |
|---|---|---|
| `.npmrc.template` | npm auth template, references `${NPM_TOKEN}` env var | ✅ yes |
| `.npmrc` | Real `.npmrc` (rendered from template) | ❌ gitignored |
| `scripts/publish.sh` | One-shot publish; reads `NPM_TOKEN` env var | ✅ yes |
| `.github/workflows/publish.yml` | CI publish; reads `secrets.NPM_TOKEN` | ✅ yes |
| `.gitignore` | Excludes `.npmrc` and `*.vsix` | ✅ yes |

### Three safe places to put your token

| Location | Best for | How |
|---|---|---|
| **Shell env var** | Local one-shot publishing | `export NPM_TOKEN=npm_xxxxx` then run the script |
| **GitHub Actions secret** | Team releases via CI UI | `Settings → Secrets → Actions → New secret`, name `NPM_TOKEN` |
| **Local `~/.npmrc`** | Day-to-day local development | `npm login` writes this; never commit it |

### Quick safety check before pushing

```bash
# Make sure no token slipped into a tracked file
git ls-files | xargs grep -lE 'npm_[A-Za-z0-9]{20,}' 2>/dev/null
# → (no output = good)

# Or with ripgrep
rg 'npm_[A-Za-z0-9]{20,}' $(git ls-files)
# → (no output = good)
```

If a token ever leaks: **revoke it immediately** at
<https://www.npmjs.com/settings/machine-w/tokens> and create a new one.

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
grep -rn "console.log\|debugger\|TODO" packages/*/src
```

### Git hygiene

```bash
git status                          # working tree clean
git fetch origin && git status       # main up to date
git status --short                  # no uncommitted changes
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
git checkout main
git pull origin main
git tag -a v0.1.0 -m "mddeck v0.1.0 — first public release"
git push origin v0.1.0
```

### 2. Create a GitHub release

```bash
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

## npm: publish `@mddeck/core` & `@mddeck/cli`

`@mddeck/core` is the **foundation** — publish it first, because
`@mddeck/cli` depends on it. (`mddeck-vscode` depends on `@mddeck/cli`,
so it should be published *after* the CLI is on npm.)

There are **three ways** to publish. Pick one:

### Option A: one-shot script (recommended for local publishing)

The repo includes `scripts/publish.sh` which:
1. Reads `NPM_TOKEN` from the environment
2. Renders `.npmrc.template` → `.npmrc` (gitignored, `chmod 600`)
3. Verifies working tree is clean, tests pass, versions match
4. Builds everything
5. Publishes `@mddeck/core`, then `@mddeck/cli`
6. Cleans up `.npmrc` automatically

```bash
# Either set it inline:
NPM_TOKEN="npm_xxxxxxxxxxxxx" bash scripts/publish.sh

# Or export first:
export NPM_TOKEN="npm_xxxxxxxxxxxxx"
yarn publish:all          # same script, called via package.json

# Dry run (no actual publish, just check what would happen):
DRY_RUN=1 NPM_TOKEN="npm_xxxxxxxxxxxxx" bash scripts/publish.sh
```

The script will **fail-fast** if:
- Working tree has uncommitted changes
- Any test fails
- The 3 packages have mismatched versions
- `yarn build` fails

> **Token safety**: the script writes `.npmrc` to disk (gitignored) with
> `chmod 600`, and removes it on exit. The token is **only** read from
> the `NPM_TOKEN` env var — never written to disk outside `.npmrc`.

### Option B: GitHub Actions (recommended for team releases)

The repo includes `.github/workflows/publish.yml` — a manual workflow
that publishes to npm using a token stored in GitHub Secrets. This is
the **safest option** for teams.

**One-time setup**:

1. Generate an npm token at <https://www.npmjs.com/settings/~/tokens>
   with publish rights to the `@mddeck` scope (type: **Automation**)
2. Go to your GitHub repo → **Settings** → **Secrets and variables**
   → **Actions** → **New repository secret**
3. Name: `NPM_TOKEN`, Value: paste the token

**Per release**:

1. Go to your GitHub repo → **Actions** → **Publish** → **Run workflow**
2. Enter the version number (e.g. `0.1.0`); optionally check "Dry run"
3. The workflow:
   - Verifies all 3 package.json versions match the input
   - Runs the test suite
   - Builds all packages
   - Publishes `@mddeck/core` then `@mddeck/cli` with **provenance**
   - Posts a summary with the npm URLs

The token never appears in logs or the repository source — it lives
only in GitHub's encrypted secret store.

### Option C: manual (when you want full control)

```bash
# 1. Log in (one-time, uses a token)
npm login --auth-type=legacy
# (or: echo "$NPM_TOKEN" | npm login --auth-type=legacy --stdin)

# 2. Verify you have publish rights
npm whoami
npm access ls-packages @mddeck/core    # should show your username

# 3. Bump the @mddeck/core dependency in packages/cli/package.json
#    from "file:../core" to "^0.1.0" (or whatever version you're publishing)
cd packages/cli
npm pkg set 'dependencies.@mddeck/core'='^0.1.0'
cd ../..

# 4. Build & dry-run
yarn build
cd packages/core
npm publish --dry-run --provenance
cd ../cli
npm publish --dry-run --provenance

# 5. Publish (in order: core, then cli)
cd packages/core
npm publish --access public --provenance
cd ../cli
npm publish --access public --provenance
```

`--access public` is required for the first publish of a scoped
package. `--provenance` attaches an attestation that the package
was built from this commit (requires `id-token: write` permission
in CI, but works locally without it).

### Verify

```bash
# Check the packages are on npm
npm view @mddeck/core
npm view @mddeck/cli

# Install in a clean directory to confirm it works
mkdir /tmp/verify-npm && cd /tmp/verify-npm
npm init -y
npm install @mddeck/core @mddeck/cli
node -e "const { MdDeck } = require('@mddeck/core'); console.log(new MdDeck().render('# Hi').html.slice(0, 60))"
# → should print HTML with <div class="step">

# And the CLI
npx mddeck /path/to/some.md -o /tmp/from-npm.html
```

---

## VS Code: package & publish `mddeck-vscode`

`mddeck-vscode` depends on `@mddeck/cli` (and transitively on
`@mddeck/core`), so **publish those to npm first**.

### Prerequisites

```bash
npm install -g @vscode/vsce

# Create a publisher account on https://marketplace.visualstudio.com/
# (Microsoft / GitHub account, then register a publisher named "mddeck")

# Login vsce to your publisher
vsce login mddeck
# (vsce will prompt for a Personal Access Token from
#  https://dev.azure.com → Security → PATs, scope "Marketplace — Manage")
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
npm install -g ovsx

# Get a token at https://open-vsx.org → your account → settings
ovsx login <your-token>

ovsx publish mddeck-vscode-0.1.0.vsix -p mddeck
```

---

## Post-release verification

After publishing, run the **cross-channel smoke test**:

```bash
# 1. Core + CLI from npm
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

# Tag + publish (any of the 3 options above)
git tag -a v0.1.1 -m "Fix ..."
git push origin v0.1.1
NPM_TOKEN="..." yarn publish:all
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
PRE-FLIGHT
□ yarn build                                            (clean build)
□ yarn test                                             (41 tests pass)
□ Bump version in 3 package.json files                 (semver)
□ Update CHANGELOG.md                                   (one entry)
□ No token leaked: rg 'npm_[A-Za-z0-9]{20,}' $(git ls-files)

GIT
□ git commit -am "Release v0.1.0"
□ git tag -a v0.1.0 -m "..." && git push origin v0.1.0
□ gh release create v0.1.0 --notes-file ...

NPM (pick one of three)
□ A) Local:    NPM_TOKEN="npm_..." yarn publish:all
□ B) CI:       set secrets.NPM_TOKEN in GitHub → run workflow
□ C) Manual:   cd packages/core && npm publish --access public --provenance
                cd packages/cli  && npm publish --access public --provenance

VSCODE
□ npm install -g @vscode/vsce && vsce login mddeck
□ cd packages/vscode && yarn build
□ vsce package
□ vsce publish

VERIFY
□ npm view @mddeck/core
□ npm view @mddeck/cli
□ npx mddeck examples/basic.md -o /tmp/x.html    (open in browser)
□ npx mddeck examples/basic.md --pdf -o /tmp/x.pdf
□ code --install-extension packages/vscode/mddeck-vscode-*.vsix
```

That's it. Ship it.
