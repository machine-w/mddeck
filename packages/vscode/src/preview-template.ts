/**
 * preview-template.ts — build the HTML string for the mddeck preview
 * webview.
 *
 * Loads impress.js + a small bootstrap script from the extension's
 * media/ directory. The deck's HTML+CSS are produced by @mddeck/core
 * the same way the CLI does.
 */

import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as vscode from 'vscode'
import { MdDeck } from '@machine-w/mddeck-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MEDIA_DIR = resolve(__dirname, '..', 'media')

function mediaUri(filename: string): string {
  return vscode.Uri
    .file(resolve(MEDIA_DIR, filename))
    .with({ scheme: 'vscode-resource' })
    .toString()
}

const IMPRESS_JS_URI = mediaUri('impress.js')
const RUNTIME_JS_URI = mediaUri('preview-runtime.js')
const MDDECK_CSS_URI = mediaUri('mddeck-vscode.css')

function extractImpressBody(fullHtml: string): string {
  const m = fullHtml.match(/<div id="impress"[\s\S]*?>([\s\S]*?)<\/div>\s*<script/)
  return m ? m[1] : ''
}

export async function renderPreviewHtml(
  markdown: string,
  sourcePath: string,
): Promise<string> {
  const deck = new MdDeck()
  const { html, css } = await deck.renderDocument({
    markdown,
    title: path.basename(sourcePath, '.md'),
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
<link rel="stylesheet" href="${MDDECK_CSS_URI}">
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
<script src="${IMPRESS_JS_URI}"></script>
<script src="${RUNTIME_JS_URI}"></script>
</body>
</html>`
}
