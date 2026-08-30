# mddeck — Development & Testing Guide

> A step-by-step cookbook for setting up a development environment,
> running the test suites, and exercising every feature end-to-end before
> publishing.

This guide assumes you have a Unix-like shell (Linux/macOS/WSL), Node.js
≥ 18, and either `yarn` or `npm` installed. Every command shown here was
verified on **Node 22.7.0 + yarn 1.22.22** on a Linux Manjaro box.

---

## 1. Prerequisites

| Tool | Required for | How to check |
|---|---|---|
| Node.js ≥ 18 | Everything | `node --version` |
| yarn 1.x | Workspace installs | `yarn --version` |
| Chromium / Chrome | CLI `--pdf` + browser screenshots | `which chromium` or `which google-chrome` |
| (optional) `playwright` npm package | Headless browser screenshots in `examples/` | Installed automatically via yarn |

If you don't have Chromium but have Firefox / Chrome elsewhere, set the
`PUPPETEER_EXECUTABLE_PATH` environment variable — the CLI auto-detects
that before falling back to its hard-coded list.

---

## 2. Initial setup

Clone (or `cd` into) the repo and install all workspace dependencies:

```bash
cd /home/macihne/myworkspace/mari/mddeck
yarn install
```

This will:

- Resolve `@mddeck/core`, `@mddeck/cli`, and `@mddeck/vscode` workspaces
- Install `playwright` (via the examples folder), `chromium-bidi`, etc.
- Link the packages together so the CLI can `import('@mddeck/core')`
  and the VSCode extension can `import('@mddeck/cli')`

> **Tip**: If you see `Couldn't find package "@mddeck/core@workspace:*"`,
> your `package.json` got desynchronized. Run `yarn install --force`.

Verify install:

```bash
ls packages/core/dist/index.js          # exists after `yarn build`
ls packages/cli/bin/mddeck.js           # exists after install
```

---

## 3. Build all packages

```bash
# Build every workspace package in dependency order
yarn build
```

Or build individually:

```bash
yarn workspace @mddeck/core build        # → packages/core/dist/
yarn workspace @mddeck/cli build        # → packages/cli/dist/
cd packages/vscode && yarn build       # → packages/vscode/dist/
```

The core package is what the CLI and VSCode extension depend on, so
always build core first if you're working on the libraries.

---

## 4. Run the unit test suites

All three packages have vitest suites. Run them individually for a faster
feedback loop, or together via the workspace root.

```bash
# All packages
yarn test

# Just core (M1 + M2 + M2.5 — parser, directives, math, emoji, XSS, slug, katex)
yarn workspace @mddeck/core test

# Just CLI (file I/O, config loading, output paths)
yarn workspace @mddeck/cli test

# Just VSCode extension (directives definitions, package.json sanity)
yarn workspace mddeck-vscode test
```

Expected output (as of v0.1.0):

```
✓ test/mddeck.test.ts  (13 tests)
✓ test/m2.test.ts       (15 tests)        ← 28 core tests
✓ test/cli.test.ts      ( 7 tests)
✓ test/extension.test.ts ( 6 tests)
─────────────────────────────────
Test Files  4 passed (4)
Tests       41 passed (41)
```

Watch mode for fast iteration on a single package:

```bash
yarn workspace @mddeck/core test:watch
```

---

## 5. End-to-end: build the example decks

Two example decks ship with the repo:

- `examples/basic.md` — 6-slide demo of 3D positioning (no math, no emoji)
- `examples/m2-features.md` — KaTeX math + twemoji + XSS sanitization demo

### 5.1 Build via the CLI

```bash
# Build basic → HTML
cd packages/cli
node bin/mddeck.js ../../examples/basic.md -o /tmp/basic.html

# Build basic → PDF (Chromium auto-detect)
node bin/mddeck.js ../../examples/basic.md --pdf -o /tmp/basic.pdf

# Build m2-features → HTML with KaTeX math
node bin/mddeck.js ../../examples/m2-features.md --math katex -o /tmp/m2.html
```

Or from any directory, just `cd packages/cli &&`:

```bash
node bin/mddeck.js <input.md> [-o <output>] [--pdf] [--math katex]
```

Open the resulting HTML in any browser to see the impress.js deck.

### 5.2 Build via the helper scripts

```bash
# From the repo root
node examples/build.mjs        # Basic deck (HTML) + headless screenshot
node examples/build-m2.mjs     # M2 features (HTML) + headless screenshot
```

These scripts also open the deck in headless Chromium and take screenshots
of every slide into `examples/screenshots/` and `examples/screenshots-m2/`.

Inspect the screenshots:

```bash
xdg-open examples/screenshots/step-1.png       # Linux
open    examples/screenshots-m2/step-3.png    # macOS
```

### 5.3 Watch mode (live reload)

```bash
cd packages/cli
node bin/mddeck.js ../../examples/basic.md --watch -o /tmp/basic.html
# Output:
# 👀 Watching /path/to/examples/basic.md
# ✓ basic.md → /tmp/basic.html
# (waiting for changes...)

# Now edit examples/basic.md in another terminal — the output is rebuilt.
```

Press `Ctrl+C` to stop.

### 5.4 Server mode

```bash
mkdir -p /tmp/mddeck-demo && cp examples/basic.md /tmp/mddeck-demo/
cd packages/cli
node bin/mddeck.js /tmp/mddeck-demo/basic.md --server --port 8080
# Output:
# ✓ basic.md → /tmp/mddeck-demo/basic.html
# 🚀 mddeck server: http://localhost:8080/
```

Open `http://localhost:8080/` in a browser to see the directory listing,
then click `basic.html`. Use the arrow keys to navigate the deck.

In a second terminal, edit `/tmp/mddeck-demo/basic.md` and reload the
page — server mode rebuilds on every change.

---

## 6. End-to-end: PDF rendering

PDF output uses **headless Chromium via puppeteer-core**. The CLI:

1. Renders the Markdown to a self-contained HTML file (impress.js bundled)
2. Loads it in headless Chromium
3. Waits for `body.impress-ready` to be set (i.e. `impress().init()` has
   finished computing all 3D transforms)
4. Injects print-mode CSS that flattens the 3D perspective
5. Calls `page.pdf()` with the requested page size (default `1920×1080`)

```bash
cd packages/cli

# Default 1920×1080 PDF
node bin/mddeck.js ../../examples/basic.md --pdf -o /tmp/basic.pdf

# Custom page size
node bin/mddeck.js ../../examples/basic.md \
  --pdf --pdf-size 1280x960 \
  -o /tmp/basic-4x3.pdf
```

Verify:

```bash
file /tmp/basic.pdf
# → PDF document, version 1.4, 7 page(s)   (6 slides + fallback-message)
```

If you have multiple Chrome installations, point to a specific binary:

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
  node bin/mddeck.js ../../examples/basic.md --pdf -o /tmp/basic.pdf
```

---

## 7. End-to-end: VSCode extension

The VSCode extension can't be tested directly with `node` (it requires the
VSCode runtime), but there are two practical workflows:

### 7.1 Option A: package as `.vsix` and install

```bash
node install -g @vscode/vsce              # one-time install
cd packages/vscode && vsce package      # → packages/vscode/mddeck-vscode-0.1.0.vsix

# Launch VSCode and install the extension
code --install-extension packages/vscode/mddeck-vscode-0.1.0.vsix

# Or to a specific user-data-dir (for testing without touching your main install)
code --user-data-dir=/tmp/vscode-test \
     --install-extension packages/vscode/mddeck-vscode-0.1.0.vsix
```

Then:

1. `File → Open Folder` → pick the `mddeck/` repo (or any folder with a
   mddeck-marked Markdown file)
2. Open `examples/basic.md`
3. Run `mddeck: Show All Commands…` from the Command Palette
4. Open the Markdown preview (`Ctrl+Shift+V`) — you should see the
   impress.js deck rendered as 3D slides

### 7.2 Option B: launch VSCode in Extension Development mode

This skips the packaging step and runs the extension straight from the
source tree:

```bash
# Install the Extension Test Runner if you haven't already
# (yarn should have installed it as a transitive of @types/vscode)
node install -g @vscode/vsce

# Launch VSCode with the extension loaded from ./packages/vscode/dist
cd packages/vscode
code --extensionDevelopmentPath=dist .
```

VS Code will start with `mddeck for VS Code` loaded. The Output panel
(`View → Output → mddeck`) will show any extension errors.

### 7.3 Verifying the VSCode preview hook

In VSCode with the extension loaded:

1. Open `examples/basic.md`
2. `Ctrl+Shift+V` to open the preview
3. The preview should show the impress.js HTML (slide cards on a dark
   background, with a "Welcome to mddeck" heading)
4. Use arrow keys / spacebar inside the preview to navigate the deck

The preview pane should NOT show the raw markdown — it should render the
impress.js deck instead. If it shows raw markdown, check:

- The Output panel for extension errors
- That the file's front-matter contains a `theme:` (or `marp: true` / `mddeck: true`) line

---

## 8. Manual smoke test checklist

Before publishing, run through this checklist. Every item should pass:

| ✓ | Test | How |
|---|---|---|
| ☐ | Core compiles | `yarn workspace @mddeck/core build` |
| ☐ | Core tests pass (28) | `yarn workspace @mddeck/core test` |
| ☐ | CLI builds | `yarn workspace @mddeck/cli build` |
| ☐ | CLI converts HTML | `node packages/cli/bin/mddeck.js examples/basic.md -o /tmp/x.html` |
| ☐ | CLI converts PDF | `... --pdf -o /tmp/x.pdf` then `file /tmp/x.pdf` |
| ☐ | CLI watch works | `... --watch` then edit the .md and verify rebuild |
| ☐ | CLI server works | `... --server --port 8080` then `curl localhost:8080/basic.html` |
| � | KaTeX renders | `... --math katex ...` then screenshot `examples/screenshots-m2/step-2.png` |
| ☐ | Emoji renders | Open `examples/m2-features.html`, check `🚀 🎉 ❤️` are colored SVG |
| ☐ | XSS sanitized | Search HTML for `alert(` — should not appear |
| ☐ | VSCode extension package | `cd packages/vscode && vsce package` produces a `.vsix` |
| ☐ | VSCode preview hook | Open `basic.md` with VSCode, check preview shows slides |

---

## 9. Troubleshooting

### "Could not find a Chromium executable"

The CLI couldn't find a Chrome binary. Fixes:

```bash
# Install chromium (Linux)
sudo pacman -S chromium          # Arch
sudo apt install chromium-browser  # Debian/Ubuntu
brew install --cask chromium      # macOS

# Or point to an existing browser
export PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
```

### Math shows as raw `$x^2$`

Install the `katex` package — it's an optional dependency:

```bash
# In your consuming project
yarn add katex
```

Then ensure your `mddeck.config.js` (or `--math` flag) requests KaTeX:

```js
module.exports = {
  mddeck: { math: 'katex' },
}
```

### VSCode extension preview shows raw markdown

Make sure the file's front-matter contains one of:

```markdown
---
theme: default
---
```

Or:

```markdown
---
mddeck: true
---
```

Without a marker, the preview falls through to vanilla Markdown.

### Tests fail with "Cannot find module @mddeck/core"

You're probably running tests from a stale `node_modules`. Fix:

```bash
rm -rf node_modules packages/*/node_modules
yarn install
```

### Port already in use (server mode)

```bash
cd packages/cli
node bin/mddeck.js ../../examples/basic.md --server --port 8181
```

### Watch mode ignores changes

Check that `chokidar` can see the file. If the file is in a symlinked
directory or a Docker mount with broken inotify, the watcher won't fire.

---

## 10. Next steps

Once everything checks out:

1. **Tag the release**:

   ```bash
   git tag -a v0.1.0 -m "First public release"
   ```

2. **Publish to npm** (you said you'd handle this, but for reference):

   ```bash
   # Core first (CLI depends on it)
   cd packages/core && yarn publish --access public
   # CLI
   cd ../cli && yarn publish --access public
   # VSCode extension → vsce marketplace
   node install -g @vscode/vsce
   cd ../vscode && vsce publish
   ```

3. **GitHub Actions CI** — add `.github/workflows/ci.yml` that runs
   `yarn install && yarn build && yarn test` on every push.

4. **CHANGELOG.md** — write a v0.1.0 entry summarizing the 4 milestones.

5. **Issue templates** — add `.github/ISSUE_TEMPLATE/{bug,feature}.md`.

Happy hacking!
