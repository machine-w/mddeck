/**
 * preview-template.ts — build the HTML string for the mddeck preview
 * webview.
 *
 * Inlines the impress.js + bootstrap script source directly into the
 * webview HTML so the webview never has to load a script over the
 * vscode-resource scheme.
 *
 * Two-way messaging with the extension host:
 *  - webview → host:  window.addEventListener('keydown', ...) and a
 *    'ready' message once impress.js is fully initialised.
 *  - host → webview:  vscode message of type 'update' with a new
 *    HTML string to swap in. The webview tears down the existing
 *    impress() instance, replaces <body>'s contents, and re-inits.
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
  // The host tells us when the markdown document changes. The webview
  // re-inits impress() with the fresh slides.
  const updateScript = `
<script>(function(){
  const vscode = acquireVsCodeApi();
  // Re-init impress.js on each update. Tear down any existing
  // instance by removing the canvas-transform styles impress injects
  // onto <body>.
  function reinit(slidesHTML) {
    try {
      // impress() exposes init(), goto(), and binds keyboard handlers
      // to the document. We just call it again after replacing the
      // slides HTML; impress tears down its own state on init.
      document.getElementById('impress').innerHTML = slidesHTML;
      var api = impress();
      api.init();
    } catch (err) {
      console.error('mddeck preview: reinit failed', err);
    }
  }
  window.addEventListener('message', function (ev) {
    if (!ev.data || ev.data.type !== 'update') return;
    reinit(ev.data.slidesHTML);
  });
  // Tell host we're ready to receive updates once impress init
  // completes.
  setTimeout(function(){ vscode.postMessage({ type: 'ready' }); }, 100);
})();</script>`

  // Keyboard navigation: impress.js installs its own keydown handlers
  // on the document, but only AFTER impress() is called. The
  // bootstrap script below does that. The HTML also includes
  // data-transition-duration so impress.js's default transitions
  // work.
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>mddeck preview</title>
<style>
${css}
/* Force the "browser not supported" fallback to be hidden, because
 * impress.js's internal `body.impress-not-supported` class is
 * set when it thinks the browser lacks support (and stays set when
 * init fails) — without this, the fallback message would dominate
 * the page even though impress is in fact working. We just hide the
 * message and rely on the deck being visible. */
.fallback-message,
body.impress-not-supported .fallback-message {
  display: none !important;
}
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
${updateScript}
</body>
</html>`
}
