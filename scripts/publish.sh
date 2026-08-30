#!/usr/bin/env bash
#
# scripts/publish.sh — One-shot publish script for @mddeck/core and @mddeck/cli.
#
# Reads NPM_TOKEN from env, writes it to .npmrc (gitignored), and publishes
# both packages in the right order (core first, since cli depends on it).
#
# Usage:
#   # Interactive: will prompt for token
#   bash scripts/publish.sh
#
#   # Non-interactive:
#   NPM_TOKEN="npm_xxxxx" bash scripts/publish.sh
#
#   # Dry run (no actual publish, just check what would happen):
#   DRY_RUN=1 NPM_TOKEN="npm_xxxxx" bash scripts/publish.sh
#
# Prereqs:
#   - Logged in to npm (run `npm login` first if not using env var)
#   - All changes committed and pushed
#   - All tests pass (`yarn test`)
#   - Version numbers bumped in all 3 package.json files
#   - CHANGELOG.md updated

set -euo pipefail

# ---------- preflight ----------
if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo "NPM_TOKEN not set. Either:"
  echo "  - export NPM_TOKEN=npm_xxxxx"
  echo "  - or run: npm login   (then re-run this script)"
  exit 1
fi

# Resolve repo root (this script is in scripts/, repo root is one level up)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ---------- write .npmrc (gitignored) from template ----------
if [[ ! -f .npmrc.template ]]; then
  echo ".npmrc.template not found in repo root"
  exit 1
fi
echo "→ Writing .npmrc from template (gitignored)..."
sed "s|\${NPM_TOKEN}|${NPM_TOKEN}|" .npmrc.template > .npmrc
chmod 600 .npmrc

# ---------- pre-publish sanity checks ----------
echo "→ Running pre-publish checks..."

if [[ -n "$(git status --porcelain)" ]]; then
  echo "::error::Working tree is dirty. Commit and push first."
  git status --short
  exit 1
fi

if ! yarn test >/dev/null 2>&1; then
  echo "::error::Tests failed. Fix them before publishing."
  exit 1
fi

CORE_VERSION=$(node -p "require('./packages/core/package.json').version")
CLI_VERSION=$(node -p "require('./packages/cli/package.json').version")
VSCODE_VERSION=$(node -p "require('./packages/vscode/package.json').version")

if [[ "$CORE_VERSION" != "$CLI_VERSION" || "$CORE_VERSION" != "$VSCODE_VERSION" ]]; then
  echo "::error::Version mismatch:"
  echo "  core:   $CORE_VERSION"
  echo "  cli:    $CLI_VERSION"
  echo "  vscode: $VSCODE_VERSION"
  echo "All three packages must share the same version."
  exit 1
fi

echo "  - Working tree: clean"
echo "  - Tests: passing"
echo "  - Version: $CORE_VERSION"

DRY_RUN_FLAG=""
if [[ "${DRY_RUN:-}" == "1" ]]; then
  DRY_RUN_FLAG="--dry-run"
  echo "  - Mode: DRY RUN (no actual publish)"
fi

# ---------- build everything ----------
echo "→ Building all packages..."
yarn build

# ---------- publish @mddeck/core ----------
echo ""
echo "→ Publishing @mddeck/core@$CORE_VERSION ..."
cd packages/core
npm publish --access public $DRY_RUN_FLAG
cd "$REPO_ROOT"

# ---------- publish @mddeck/cli ----------
echo ""
echo "→ Publishing @mddeck/cli@$CLI_VERSION ..."
cd packages/cli
npm publish --access public $DRY_RUN_FLAG
cd "$REPO_ROOT"

# ---------- done ----------
echo ""
echo "✓ All packages published."
echo "  - https://www.npmjs.com/package/@mddeck/core"
echo "  - https://www.npmjs.com/package/@mddeck/cli"
echo ""
echo "Next: publish the VS Code extension with:"
echo "  cd packages/vscode && vsce publish"
