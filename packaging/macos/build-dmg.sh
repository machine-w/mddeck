#!/usr/bin/env bash
#
# packaging/macos/build-dmg.sh — produce a polished .dmg for the compiled mddeck binary.
#
# Expects `build/mddeck` (the bun-compiled binary) in the repo root and runs
# `create-dmg` to wrap it in a .dmg with a drag-to-Applications window.
#
# The bare-binary-folder layout (NOT a .app bundle) is intentional:
#   * simpler pipeline, no Info.plist to maintain
#   * ad-hoc signing produces the same Gatekeeper behavior either way
#   * a future PR can wrap the binary in a .app bundle if needed
#
# Env:
#   TAG  — release tag, e.g. "v0.1.8". Defaults to $GITHUB_REF_NAME, then "dev".
#   ARCH — "arm64" or "x64". Defaults to "arm64".

set -euo pipefail

TAG="${TAG:-${GITHUB_REF_NAME:-dev}}"
ARCH="${ARCH:-arm64}"

# Resolve repo root so the script works regardless of cwd. Lets us run it from
# any platform build dir (e.g. build/macos-arm64/) without breaking.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUILD_BIN="${REPO_ROOT}/build/mddeck"
STAGE="${REPO_ROOT}/dist/mddeck-macos"
DMG="${REPO_ROOT}/packaging/macos/mddeck-${TAG}-macos-${ARCH}.dmg"

rm -rf "$STAGE" "$DMG"
mkdir -p "$STAGE"

cp "$BUILD_BIN" "$STAGE/mddeck"
chmod +x "$STAGE/mddeck"
ln -s /Applications "$STAGE/Applications"

create-dmg \
  --volname "mddeck Installer" \
  --skip-jenkins \
  --overwrite \
  "$DMG" \
  "$STAGE"