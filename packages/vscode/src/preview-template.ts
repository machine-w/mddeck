/**
 * preview-template.ts — build the HTML string for the mddeck preview
 * webview.
 *
 * Inlines the impress.js + bootstrap script source directly into the
 * webview HTML so the webview never has to load a script over the
 * vscode-resource:// scheme (which is unreliable in some
 * sandbox configurations). impress.js itself is shipped in
 * media/impress.js; at preview time we read it from disk and embed
 * its contents inside a <script> tag.
 */

import { promises as fssync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as vscode from 'vscode'
import { MdDeck } from '@machine-w/mddeck-core'

function extractSlides(fullHtml: string): string {
  const m = fullHtml.match(
    /<div class="mddeck-slide-container"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/,
  )
  return m ? m[1] : ''
}

export async function renderPreviewHtml(
  markdown: string,
  sourcePath: string,
  context: vscode.ExtensionContext,
): Promise<string> {
  // Locate the bundled impress.js by walking up from the bundled
  // extension.js to the extension's media/ directory.
  const url = (import.meta as any).url as string
  const bundleDir = dirname(fileURLToPath(url))
  const mediaDir = resolve(bundleDir, '..', 'media')
  const impressSource = await fssync.readFile(
    resolve(mediaDir, 'impress.js'),
    'utf-8',
  )

  const deck = new MdDeck()
  const { html, css } = await deck.renderAsString(markdown)
  const slides = extractSlides(html)

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>mddeck preview</title>
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
     data-width="1920" data-height="1080"
     data-perspective="1000">
${slides}
</div>
<script>
${impressSource}
</script>
<script>
(function () {
  function init() {
    try {
      if (typeof impress !== 'function') {
        console.error('mddeck preview: impress is not loaded');
        return;
      }
      var api = impress();
      api.init();
      document.body.classList.remove('impress-not-supported');
      document.body.classList.add('impress-ready');
    } catch (err) {
      console.error('mddeck preview: impress init failed', err);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
</body>
</html>`
}
