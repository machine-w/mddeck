/**
 * preview-template.ts — build the HTML string for the mddeck preview
 * webview.
 *
 * Loads impress.js + a small bootstrap script from the extension's
 * media/ directory. The deck's HTML+CSS are produced by @mddeck/core
 * the same way the CLI does.
 *
 * IMPORTANT: do NOT evaluate module-level code that touches
 * `import.meta.url` (or any other relative path). The extension
 * host's `__filename` does NOT match the on-disk path of the
 * bundled extension.js, so resolving media/ at import time
 * throws. Everything is evaluated lazily inside renderPreviewHtml.
 */

import { promises as fs } from 'node:fs'
import { promises as fssync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as vscode from 'vscode'
import { MdDeck } from '@machine-w/mddeck-core'

/** Lazily compute the path to the extension's media/ directory.
 *  Called on demand from renderPreviewHtml — never at import time. */
function mediaDir(): string {
  // import.meta.url in the bundled CJS is replaced with
  // `globalThis.importMetaURL` (see scripts/build.mjs banner). At
  // runtime in the extension host that resolves to a file:// URL
  // pointing at the bundle's directory.
  const url = (import.meta as any).url as string
  return resolve(dirname(fileURLToPath(url)), '..', 'media')
}

function mediaUri(filename: string): string {
  return vscode.Uri
    .file(resolve(mediaDir(), filename))
    .with({ scheme: 'vscode-resource' })
    .toString()
}

function extractImpressBody(fullHtml: string): string {
  const m = fullHtml.match(/<div id="impress"[\s\S]*?>([\s\S]*?)<\/div>\s*<script/)
  return m ? m[1] : ''
}

export async function renderPreviewHtml(
  markdown: string,
  sourcePath: string,
): Promise<string> {
  const impress = mediaUri('impress.js')
  const runtime = mediaUri('preview-runtime.js')
  const mddeckCss = mediaUri('mddeck-vscode.css')

  const deck = new MdDeck()
  const { html, css } = await deck.renderDocument({
    markdown,
    title: sourcePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') ?? 'preview',
    author: '',
    impressJsBundle: '',
    extraCss: '',
  })
  const slides = extractImpressBody(html)
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>mddeck preview</title>
<link rel="stylesheet" href="${mddeckCss}">
<style>
${css}
.fallback-message { display: none; }
</style>
</head>
<body class="impress-not-supported">
<div class="fallback-message">
  <p>Your browser does not support impress.js.</p>
</div>
<div id="impress"
     data-transition-duration="1000"
     data-width="1920" data-height="1080">
${slides}
</div>
<script src="${impress}"></script>
<script src="${runtime}"></script>
</body>
</html>`
}
