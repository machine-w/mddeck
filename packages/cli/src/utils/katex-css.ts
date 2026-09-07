/**
 * katex-css.ts — load + self-inline the KaTeX stylesheet for HTML output.
 *
 * Why this exists:
 *   The mddeck core ships only a few small KaTeX CSS overrides (see
 *   @machine-w/mddeck-core/plugins_katex/katex-css.ts). The full
 *   katex.min.css from the `katex` npm package — including all the font
 *   @font-face rules — is needed for math to render correctly.
 *
 *   Without it, the <math> MathML element shows as plain text alongside
 *   the rendered katex-html output, and the user sees every formula
 *   twice (m2-features.html has this bug, see the existing screenshots).
 *
 * What this module does:
 *   1. Resolve the `katex` package from the user's project (or from
 *      mddeck's own node_modules) using createRequire.
 *   2. Read katex.min.css + all the .woff2/.woff/.ttf font files.
 *   3. Rewrite every `url(fonts/...)` reference in the CSS into a
 *      base64-encoded data: URI, so the resulting CSS is fully
 *      self-contained and doesn't need any external assets.
 *   4. Return the final CSS string, ready to drop into <style> via
 *      the extraCss template option.
 *
 * If the katex package can't be found, this returns `null` and the
 * caller should warn the user.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import type { Module } from 'node:module'

/** MIME type for a given font file extension. */
function fontMimeType(p: string): string {
  if (p.endsWith('.woff2')) return 'font/woff2'
  if (p.endsWith('.woff')) return 'font/woff'
  if (p.endsWith('.ttf')) return 'font/ttf'
  if (p.endsWith('.otf')) return 'font/otf'
  if (p.endsWith('.eot')) return 'application/vnd.ms-fontobject'
  return 'application/octet-stream'
}

/** Try to resolve a katex package via a require created at `fromDir`. */
function tryResolveKatexFrom(fromDir: string): string | null {
  try {
    // createRequire takes a URL or a path string. Use the latter.
    const req = createRequire(join(fromDir, 'noop.js') as string)
    const katexPkgPath = req.resolve('katex/package.json') as string
    if (existsSync(katexPkgPath)) {
      return dirname(katexPkgPath)
    }
  } catch {
    // katex not installed
  }
  return null
}

/** Locate the katex package, walking up from the user's CWD. */
function locateKatex(): string | null {
  // We resolve katex from the user's CWD, not the CLI's own install
  // location. This matches how the user thinks about the dependency
  // graph: katex is a peer of the user's project, not of the CLI.
  //
  // Fallback: also try the CLI's own dist directory, in case the user
  // happens to have katex installed alongside the CLI (e.g. via a
  // monorepo or a parent-of-CLI install).
  const candidates: string[] = [process.cwd()]
  try {
    const here = dirname(new URL(import.meta.url).pathname)
    candidates.push(here)
    candidates.push(join(here, '..'))
  } catch {
    /* ESM import.meta.url unavailable, fall back to cwd-only */
  }
  for (const dir of candidates) {
    const found = tryResolveKatexFrom(dir)
    if (found) return found
  }
  return null
}

/**
 * Read katex.min.css and inline every `url(fonts/...)` font reference
 * as a base64 data URI. Returns null if katex isn't installed.
 */
export function loadKatexCss(): string | null {
  const katexDir = locateKatex()
  if (!katexDir) return null

  const cssPath = join(katexDir, 'dist', 'katex.min.css')
  if (!existsSync(cssPath)) return null

  let css = readFileSync(cssPath, 'utf-8')

  // Replace `url(fonts/Whatever.woff2)` (and the other extensions) with
  // a base64 data URI. KaTeX's CSS uses a single-quoted `url('fonts/...')`
  // form in the .min.css, so handle both single- and double-quoted.
  const fontsDir = join(katexDir, 'dist', 'fonts')
  css = css.replace(
    /url\((['"]?)fonts\/([^)'"]+)\1\)/g,
    (_match, _quote, fontFile) => {
      const fontPath = join(fontsDir, fontFile)
      if (!existsSync(fontPath)) return _match
      const data = readFileSync(fontPath)
      const b64 = data.toString('base64')
      return `url(data:${fontMimeType(fontPath)};base64,${b64})`
    },
  )

  return css
}
