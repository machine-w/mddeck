/**
 * print_mode — When the MdDeck instance is constructed with `printable: true`,
 * this plugin injects a CSS string that flattens impress.js's 3D layout for
 * PDF export:
 *
 *   - Disables perspective on the #impress root
 *   - Resets each step's transform so they stack vertically in DOM order
 *   - Hides the canvas transform on the body
 *
 * The actual `transform-style: flat` is applied via the host template; this
 * plugin emits the CSS that the host injects into the <style> block.
 */

import { marpitPlugin } from './marpit_plugin.js'

const PRINT_CSS = `
/* mddeck: print mode — flatten impress.js 3D for PDF */
#impress {
  perspective: none !important;
  transform-style: flat !important;
}
.step {
  position: relative !important;
  transform: none !important;
  transform-origin: 50% 50% !important;
  page-break-after: always;
  break-after: page;
}
.step:last-child { page-break-after: auto; break-after: auto; }
`

function printMode(md: any): void {
  md.core.ruler.after('mddeck_auto_layout', 'mddeck_print_mode', (state: any) => {
    if (state.inlineMode) return
    // Append CSS to lastStyles so it lands in the packed CSS output.
    // Marpit's `style/assign.js` already appends to `marpit.lastStyles`.
    const marpit = md.marpit
    if (marpit && Array.isArray(marpit.lastStyles)) {
      marpit.lastStyles.push(PRINT_CSS)
    }
  })
}

export const printModePlugin = marpitPlugin(printMode)
