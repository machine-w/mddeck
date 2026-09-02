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

# ---------- cleanup trap ----------
# `.npmrc` is rendered from the gitignored template with the real auth
# token in it. We must remove it on ANY exit path — success, error,
# or signal — so a token never lingers on disk if the script aborts.
trap 'rm -f "$REPO_ROOT/.npmrc"' EXIT

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

# Inject the real token into the rendered .npmrc. The provenance line is
# added conditionally based on whether we're in a CI environment (which
# has OIDC) — local runs must NOT have it on, or npm will fail with
# "Automatic provenance generation not supported for provider: null".
PROVENANCE_LINE=""
if [[ -n "${CI:-}" || -n "${GITHUB_ACTIONS:-}" ]]; then
  PROVENANCE_LINE="provenance=true"
  PROVENANCE_FLAG="--provenance"
  echo "  - Provenance: ENABLED (CI detected)"
else
  PROVENANCE_FLAG=""
  echo "  - Provenance: disabled (local run — needs OIDC)"
fi

# Substitute ${NPM_TOKEN} and inject / remove the provenance line.
sed -e "s|\${NPM_TOKEN}|${NPM_TOKEN}|" \
    -e "s|^provenance=.*|${PROVENANCE_LINE}|" \
    .npmrc.template > .npmrc
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
CORE_NAME=$(node -p "require('./packages/core/package.json').name")
CLI_NAME=$(node -p "require('./packages/cli/package.json').name")
VSCODE_NAME=$(node -p "require('./packages/vscode/package.json').name")

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

# PROVENANCE_FLAG is set above (when we render .npmrc). When in CI it's
# set to --provenance; on local runs it's empty so npm doesn't try to
# generate provenance without OIDC and fail.

# ---------- build everything ----------
echo "→ Building all packages..."
yarn build

# ---------- publish @machine-w/mddeck-core ----------
echo ""
echo "→ Publishing ${CORE_NAME}@$CORE_VERSION ..."
cd packages/core
npm publish --access public $DRY_RUN_FLAG $PROVENANCE_FLAG
cd "$REPO_ROOT"

# ---------- publish @machine-w/mddeck-cli ----------
#
# CRITICAL: the published cli cannot depend on `"file:../core"` because
# `file:` paths only resolve inside the monorepo. Before publishing, swap
# the dependency for the version we just published, then restore the
# `file:` form afterwards so the monorepo keeps working.
echo ""
echo "→ Publishing ${CLI_NAME}@$CLI_VERSION ..."
cd packages/cli

CLI_PKG=package.json
ORIGINAL_DEP=$(node -p "require('./$CLI_PKG').dependencies['@machine-w/mddeck-core'] || ''")
echo "  - Original @machine-w/mddeck-core dep in cli: $ORIGINAL_DEP"

# If the dependency is file:..., temporarily switch it to the version
# we just published, publish, then restore.
if [[ "$ORIGINAL_DEP" == file:* ]]; then
  echo "  - Temporarily setting @machine-w/mddeck-core to ^$CORE_VERSION for publish"
  npm pkg set "dependencies.@machine-w/mddeck-core=^$CORE_VERSION"

  # Publish
  npm publish --access public $DRY_RUN_FLAG $PROVENANCE_FLAG
  PUBLISH_EXIT=$?

  # Restore the original (file:../core) so the monorepo keeps working
  echo "  - Restoring @machine-w/mddeck-core dep to $ORIGINAL_DEP"
  npm pkg set "dependencies.@machine-w/mddeck-core=$ORIGINAL_DEP"

  exit $PUBLISH_EXIT
else
  # Already a semver range — just publish
  npm publish --access public $DRY_RUN_FLAG $PROVENANCE_FLAG
fi
cd "$REPO_ROOT"

# ---------- done ----------
echo ""
echo "✓ All packages published."
echo "  - https://www.npmjs.com/package/${CORE_NAME}"
echo "  - https://www.npmjs.com/package/${CLI_NAME}"
echo ""
echo "Next: publish the VS Code extension with:"
echo "  cd packages/vscode && vsce publish"
