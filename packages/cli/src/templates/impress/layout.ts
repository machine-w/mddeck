/**
 * impress template — generates a complete single-file HTML document with
 * inlined impress.js runtime. This is the CLI's default output format.
 *
 * Unlike marp-cli's bespoke template (which embeds a complex JS player),
 * mddeck just emits a slim document + the impress.js bundle + an init
 * script that marks `body.impress-ready` once impress().init() completes
 * (used by the PDF flow to know when rendering has finished).
 */

import type { MdDeck } from '@mddeck/core'
import { getImpressJsBundle } from '../../impress-bundle.js'

export interface ImpressTemplateOptions {
  /** Raw impress.js source (overrides the bundled one) */
  impressJs?: string
  /** Page title */
  title?: string
  /** Author meta */
  author?: string
  /** Extra CSS to inject */
  extraCss?: string
}

export async function renderImpressTemplate(
  deck: MdDeck,
  markdown: string,
  options: ImpressTemplateOptions = {},
): Promise<string> {
  const { html, css, comments } = await deck.renderAsString(markdown)

  const impressBundle = options.impressJs ?? getImpressJsBundle()
  const title = escapeHtml(options.title ?? 'mddeck presentation')
  const author = options.author
    ? `<meta name="author" content="${escapeHtml(options.author)}">`
    : ''

  const sizeW = deck.sizeInfo.width
  const sizeH = deck.sizeInfo.height
  const persp = deck.sizeInfo.perspective

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${author}
<style>
${css}
${options.extraCss ?? ''}
</style>
</head>
<body class="impress-not-supported">
<div class="fallback-message">
  <p>Your browser does not support impress.js. Please use a modern browser.</p>
</div>
<div id="impress"
     data-transition-duration="1000"
     data-width="${sizeW}"
     data-height="${sizeH}"
     data-max-scale="3"
     data-min-scale="0"
     data-perspective="${persp}">
${html}
</div>
<script>${impressBundle}</script>
<script>
(function(){
  function init() {
    try {
      var api = window.impress ? window.impress() : null;
      if (api && typeof api.init === 'function') {
        api.init();
        document.body.classList.add('impress-ready');
        document.body.classList.remove('impress-not-supported');
      }
    } catch (e) {
      console.error('mddeck: impress init failed', e);
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
