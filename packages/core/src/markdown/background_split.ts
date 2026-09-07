/**
 * background_split — mddeck extension that honors Marpit's
 * `![bg left:N%]` / `![bg right:N%]` syntax even when inline SVG is
 * disabled.
 *
 * Background:
 *     Marpit's normal background-image apply step (in
 *     `@marp-team/marpit/markdown/background_image/apply.js`) supports the
 *     "split background" feature — `![bg left:33%](image)` — but only
 *     when `inlineSVG: true`. It does this by wrapping the slide
 *     content in an `<svg>` and laying the image out as a sub-rect.
 *
 *     We disable inlineSVG in mddeck (see the comment in mddeck.ts) so
 *     that the impress.js step rewrite doesn't fight with SVG layout,
 *     and we instead render backgrounds as plain `background-image` CSS.
 *     Unfortunately this also kills the split feature — `![bg left:33%]`
 *     ends up as just `![bg]` (a full-bleed cover), with the `left:33%`
 *     part silently dropped on the floor.
 *
 * What this plugin does:
 *     Runs after `marpit_apply_background_image`. For every slide, it
 *     walks the inline image tokens and checks `marpitImage.backgroundSplit`
 *     / `backgroundSplitSize` (set by marpit's parse step). If present
 *     and the image is the slide's background image, it overrides
 *     `backgroundSize` with the split fraction and adds a
 *     `backgroundPosition: <side>` directive.
 *
 *     The result is plain CSS that browsers render correctly:
 *         background-image: url("…");
 *         background-size: 33% auto;       ← was "cover"
 *         background-position: left center; ← was missing
 *         background-repeat: no-repeat;
 */

import { marpitPlugin } from './marpit_plugin.js'

function backgroundSplit(md: any): void {
  md.core.ruler.after(
    'marpit_apply_background_image',
    'mddeck_background_split',
    (state: any) => {
      if (state.inlineMode) return

      // Walk all slide-open tokens; for each, find any inline image
      // token inside its children that has backgroundSplit set, and
      // override the slide's directives accordingly.
      const tokens = state.tokens
      let current: any = null

      for (const t of tokens) {
        if (t.type === 'marpit_slide_open') {
          current = t
          continue
        }
        if (t.type === 'marpit_slide_close') {
          current = null
          continue
        }
        if (!current) continue

        // The apply step sets directives on the slide-open token's meta.
        // We add / override backgroundSize and backgroundPosition.
        const direct = current.meta?.marpitDirectives
        if (!direct) continue

        // Walk inline children to find the split-configured image
        if (t.type === 'inline') {
          for (const child of t.children) {
            if (child.type !== 'image') continue
            const img = child.meta?.marpitImage
            if (!img || !img.backgroundSplit) continue

            // Take the URL from the current directive (already set by
            // marpit_apply_background_image) to confirm this image is
            // the actual background, not just a regular image.
            const dirUrl = direct.backgroundImage
            if (!dirUrl || !dirUrl.includes(img.url)) continue

            const side = img.backgroundSplit === 'left' ? 'left' : 'right'
            const size = img.backgroundSplitSize || '50%'

            direct.backgroundSize = size
            direct.backgroundPosition = side + ' center'
            // Ensure no-repeat (parse.js already sets this in the inline
            // path; copy it through in case the simple apply step
            // didn't propagate it).
            if (!direct.backgroundRepeat) direct.backgroundRepeat = 'no-repeat'
          }
        }
      }
    },
  )
}

export const backgroundSplitPlugin = marpitPlugin(backgroundSplit)