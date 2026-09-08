/**
 * impress template — generates a complete single-file HTML document with
 * inlined impress.js runtime. This is the CLI's default output format.
 *
 * Unlike marp-cli's bespoke template (which embeds a complex JS player),
 * mddeck just emits a slim document + the impress.js bundle + an init
 * script that marks `body.impress-ready` once impress().init() completes
 * (used by the PDF flow to know when rendering has finished).
 */

import type { MdDeck } from '@machine-w/mddeck-core'
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
/* mddeck: ESC toggles overview (thumbnail-grid) mode.
   When body.mddeck-overview is active, neutralize impress.js's 3D
   transforms on every step and lay them out as a scrollable grid. Click
   a thumbnail to jump to that slide and exit overview. */
body.mddeck-overview #impress,
body.mddeck-overview #impress > div,
body.mddeck-overview .mddeck-slide-container {
  position: relative !important;
  transform: none !important;
  top: auto !important;
  left: auto !important;
  perspective: none !important;
  transform-style: flat !important;
}
/* impress.js wraps slides in <div id="impress"> > anonymous <div> > div.marpit.mddeck
   > div.mddeck-slide-container > div.step. The flex layout has to land on the
   div that's the direct parent of the slide containers, so we match the
   marpit container by class (instead of by hierarchy, which is fragile). */
body.mddeck-overview #impress,
body.mddeck-overview #impress > div,
body.mddeck-overview .marpit.mddeck {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  align-items: flex-start !important;
  width: auto !important;
  height: auto !important;
  padding: 24px !important;
  margin: 0 !important;
}
body.mddeck-overview .mddeck-slide-container {
  width: 320px !important;
  height: 180px !important;
  margin: 16px !important;
  overflow: hidden !important;
  border: 2px solid rgba(0,0,0,.15);
  border-radius: 4px;
  cursor: pointer;
  opacity: 1 !important;
  page-break-after: auto !important;
  break-after: auto !important;
  transition: transform 120ms ease;
}
body.mddeck-overview .mddeck-slide-container:hover { transform: scale(1.04); }
body.mddeck-overview .mddeck-slide-container:has(.step.present) {
  outline: 3px solid #0969da;
  outline-offset: -3px;
}
body.mddeck-overview .step {
  position: absolute !important;
  transform: scale(0.166) !important;
  /* step is 1920×1080; thumbnail is 320×180 → 320/1920 = 0.1667 */
  transform-origin: top left !important;
  top: 0 !important;
  left: 0 !important;
  pointer-events: none;
}
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

  // mddeck: ESC toggles overview (thumbnail-grid) mode.
  // impress.js itself doesn't ship an overview (its only public API is
  // init/goto/next/prev — no exit()/resume(), contrary to my earlier
  // guess). So we just toggle a body class; the CSS rules above do
  // the rest. ESC is ignored while focus is in an editable element so
  // it doesn't break form fields.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (e.target && /^(input|textarea|select)$/i.test(e.target.tagName)) return;
    document.body.classList.toggle('mddeck-overview');
  });
  // Click a thumbnail in overview mode to jump to it and exit overview.
  // Note: in overview mode the .step itself has pointer-events: none,
  // so clicks land on the .mddeck-slide-container wrapper. We look up
  // the wrapper, then drill down to its .step child for impress.goto().
  document.addEventListener('click', function (e) {
    if (!document.body.classList.contains('mddeck-overview')) return;
    var card = e.target.closest && e.target.closest('.mddeck-slide-container');
    if (!card) return;
    document.body.classList.remove('mddeck-overview');
    var step = card.querySelector('.step');
    var api = window.impress && window.impress();
    if (step && api && typeof api.goto === 'function') api.goto(step);
  });
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
