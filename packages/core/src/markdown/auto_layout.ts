/**
 * auto_layout — Assigns default 3D positions to steps that the user did not
 * explicitly position with the `position:` directive.
 *
 * Without this plugin, every step would default to (0,0,0) and stack on top
 * of each other. The default layout is a 3D spiral so each step is visible
 * and the resulting deck feels naturally arranged.
 *
 * Runs AFTER `mddeck_impress` so it can see the final `data-*` attributes
 * and decide whether a step already has an explicit position.
 */

import { marpitPlugin } from './marpit_plugin.js'

const STEP_WIDTH = 1920
const STEP_HEIGHT = 1080
const SPACING_X = 600 // horizontal gap between steps
const SPACING_Y = 400 // vertical gap

function autoLayout(md: any): void {
  md.core.ruler.after('mddeck_impress', 'mddeck_auto_layout', (state: any) => {
    if (state.inlineMode) return
    const slides: any[] = []
    // First pass: collect slide open tokens
    for (const t of state.tokens) {
      if (t.meta?.marpitSlideElement === 1) slides.push(t)
    }

    // Second pass: assign positions to those missing data-x/y
    let i = 0
    for (const token of slides) {
      const hasX = token.attrGet('data-x') != null
      const hasY = token.attrGet('data-y') != null
      const hasZ = token.attrGet('data-z') != null

      // Spiral layout: spread steps on a 2D grid with slight z variation
      const cols = 4
      const row = Math.floor(i / cols)
      const col = i % cols
      const x = col * (STEP_WIDTH + SPACING_X) - (cols - 1) * (STEP_WIDTH + SPACING_X) / 2
      const y = row * (STEP_HEIGHT + SPACING_Y)
      const z = -row * 200 // slight depth, gives a 3D feel

      if (!hasX) token.attrSet('data-x', String(Math.round(x)))
      if (!hasY) token.attrSet('data-y', String(Math.round(y)))
      if (!hasZ) token.attrSet('data-z', String(Math.round(z)))

      i += 1
    }
  })
}

export const autoLayoutPlugin = marpitPlugin(autoLayout)
