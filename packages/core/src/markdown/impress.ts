/**
 * mddeck_impress — Core markdown-it plugin that transforms Marpit slide tokens
 * into impress.js compatible steps.
 *
 * Each Marpit `marpit_slide_open` token (the <section> wrapper from
 * `@marp-team/marpit/src/markdown/slide.js`) is rewritten as a `<div class="step">`
 * with the data-* attributes that impress.js consumes:
 *
 *   data-x / data-y / data-z
 *   data-rotate / data-rotate-x / data-rotate-y / data-rotate-z / data-rotate-order
 *   data-scale
 *   data-transition-duration (per-step override)
 *   data-rel-position / data-rel-to  (delegated to impress.js's rel plugin when bundled)
 *
 * The plugin reads the value from `token.meta.marpitDirectives` (already populated
 * by `marpit_directives_apply` upstream in the pipeline). Custom directives defined
 * by `@machine-w/mddeck-core` (see ./directives.ts) populate that meta object before this
 * plugin runs.
 */

import MarkdownIt from 'markdown-it'
import { marpitPlugin } from './marpit_plugin.js'

// Reuse a plain markdown-it instance (NOT the marpit subclass) to render
// speaker note values. Marpit's `render()` is overridden to ignore its
// `src` argument and re-render the last slide tokens — useless for
// arbitrary note strings — and its renderer also wraps the result in
// `<div class="marpit mddeck">…</div>`. A plain MarkdownIt gives us a
// clean render of just the note content.
const noteParser = new MarkdownIt({ html: true, linkify: true, typographer: true })

/**
 * Maps a directive key to the corresponding impress.js data-* attribute.
 * Used to render arbitrary custom directives (e.g. `transitionDuration: 800`
 * → `data-transition-duration="800"`).
 *
 * When applying a compound `rotate` object, the inner keys `x/y/z/order`
 * need a different mapping (`data-rotate-x/y/z/order`). Use ROTATE_OBJECT_MAP
 * for those.
 */
const DIRECTIVE_TO_ATTR: Record<string, string> = {
  x: 'data-x',
  y: 'data-y',
  z: 'data-z',
  rotate: 'data-rotate',
  rotateX: 'data-rotate-x',
  rotateY: 'data-rotate-y',
  rotateZ: 'data-rotate-z',
  rotateOrder: 'data-rotate-order',
  scale: 'data-scale',
  transitionDuration: 'data-transition-duration',
  relPosition: 'data-rel-position',
  relTo: 'data-rel-to',
  relX: 'data-rel-x',
  relY: 'data-rel-y',
  relZ: 'data-rel-z',
}

/** Key map when applying values from inside a `rotate` object. */
const ROTATE_OBJECT_MAP: Record<string, string> = {
  x: 'data-rotate-x',
  y: 'data-rotate-y',
  z: 'data-rotate-z',
  order: 'data-rotate-order',
}

/** Keys we pull from `position` object (camelCase → data-* kebab-case). */
const POSITION_KEYS = ['x', 'y', 'z'] as const
// Inside a compound `rotate` object, the user writes `x/y/z` (like position).
// These get mapped to data-rotate-x/y/z.
const ROTATE_OBJECT_KEYS = ['x', 'y', 'z', 'order'] as const
// Flat rotate keys (the user may write `rotateZ: 90` directly without nesting).
const ROTATE_FLAT_KEYS = ['rotateX', 'rotateY', 'rotateZ', 'rotateOrder'] as const
const SCALE_KEYS = ['scale'] as const
const REL_KEYS = ['relPosition', 'relTo', 'relX', 'relY', 'relZ'] as const

/** Directive keys that should be skipped when copying to data-* attributes. */
const SKIP_KEYS = new Set(['position', 'rotate', 'class', 'note'])

function applyAttrs(
  token: any,
  source: Record<string, unknown> | undefined,
  keys: readonly string[],
  map: Record<string, string> = DIRECTIVE_TO_ATTR,
): void {
  if (!source) return
  for (const k of keys) {
    const attr = map[k]
    const v = source[k]
    if (attr && v != null && v !== '') token.attrSet(attr, String(v))
  }
}

function _impress(md: any): void {
  md.core.ruler.after(
    'marpit_directives_apply',
    'mddeck_impress',
    (state: any) => {
      if (state.inlineMode) return
      let stepIndex = 0

      for (let i = 0; i < state.tokens.length; i++) {
        const token = state.tokens[i]
        if (token.meta?.marpitSlideElement !== 1) {
          // close token: also rewrite tag
          if (token.meta?.marpitSlideElement === -1) token.tag = 'div'
          continue
        }

        const dir: Record<string, any> = token.meta?.marpitDirectives || {}
        stepIndex += 1

        // Tag rewrite: <section> → <div class="step" id="...">
        token.tag = 'div'
        const existingClass = token.attrGet('class') || ''
        token.attrSet('class', `step${existingClass ? ' ' + existingClass : ''}`)
        // Always override id with `step-N` format for impress.js clarity
        token.attrSet('id', `step-${stepIndex}`)

        // 1. Flat `x/y/z/scale/rotateX/Y/Z/...` directives on the slide
        applyAttrs(token, dir, [
          ...POSITION_KEYS,
          ...ROTATE_FLAT_KEYS,
          ...SCALE_KEYS,
          'transitionDuration',
        ])
        applyAttrs(token, dir, REL_KEYS)

        // 2. Compound `position` object → data-x/y/z
        if (dir.position && typeof dir.position === 'object') {
          applyAttrs(token, dir.position, POSITION_KEYS)
        }

        // 3. Compound `rotate` object → data-rotate-x/y/z/order
        //    (Note: NOT data-rotate; that would collide with the flat `rotate: 90` form.)
        if (dir.rotate && typeof dir.rotate === 'object') {
          applyAttrs(token, dir.rotate, ROTATE_OBJECT_KEYS, ROTATE_OBJECT_MAP)
        }

        // 4. Forward any additional custom directives as data-* (kebab-case)
        for (const key of Object.keys(dir)) {
          if (SKIP_KEYS.has(key)) continue
          if (DIRECTIVE_TO_ATTR[key]) continue // already handled above
          const value = dir[key]
          if (value == null || value === '') continue
          const attr = `data-${kebab(key)}`
          token.attrSet(attr, String(value))
        }

        // 5. Speaker notes — render the directive value as Markdown via
        //    a plain markdown-it instance (we can't use `md.render` here
        //    because marpit's override re-renders the whole deck), then
        //    wrap the rendered HTML in <div class="notes">…</div> and
        //    insert it as a sibling body token *before* the slide's
        //    close token. Pushing it onto the open token's children
        //    doesn't work because marpit's wrap_tokens places the body
        //    content as siblings of the open/close pair, not inside
        //    them.
        const note: string | undefined = dir.note
        if (note) {
          const noteHtml = noteParser.render(note)
          const noteToken = new state.Token('html_block', '', 0)
          noteToken.content = `<div class="notes">${noteHtml}</div>\n`
          // Find this slide's close token (marpitSlideElement: -1, the
          // token immediately following the slide body). Insert the
          // noteToken just before it so it renders as the last child
          // of the slide body.
          for (let j = i + 1; j < state.tokens.length; j++) {
            if (state.tokens[j].meta?.marpitSlideElement === -1) {
              state.tokens.splice(j, 0, noteToken)
              break
            }
          }
        }
      }
    },
  )
}

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()).replace(/^-/, '')
}

export const mddeckImpress = marpitPlugin(_impress)
