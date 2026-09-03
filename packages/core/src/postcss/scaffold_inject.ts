/**
 * PostCSS plugin: inject mddeck scaffold CSS into the packed theme output.
 *
 * Why: Marpit's theme system has its own internal `scaffold` theme that gets
 * injected automatically by `themeSet.pack()`. We can't easily replace it
 * with our own scaffold (which uses `.step` selectors and mddeck CSS vars).
 * So we inject our scaffold as a PostCSS plugin that runs after the theme
 * pack. We PREPEND our scaffold so it lands at the BEGINNING of the final
 * stylesheet — it sets the base variables and rules, and the active theme
 * CSS (which comes after) overrides them.
 *
 * Note: an earlier version of this file used `root.append(scaffoldCss)`,
 * which put the scaffold CSS at the END of the sheet. With same-
 * specificity rules, the appended scaffold then overrode the active
 * theme — e.g. the gaia theme's `--mddeck-bg: #1c3a5e` was being
 * overridden by scaffold's `--mddeck-bg: white`, so gaia slides
 * rendered with a white background instead of the intended dark blue
 * gradient. Prepending restores the documented cascade: scaffold is
 * the BASE, themes are the OVERRIDES.
 */

import type { PluginCreator } from 'postcss'
import { scaffoldCss } from '../themes/scaffold.js'

const scaffoldInjectPlugin: PluginCreator<never> = () => {
  return {
    postcssPlugin: 'mddeck-scaffold-inject',
    Once(root) {
      root.prepend(scaffoldCss)
    },
  }
}
scaffoldInjectPlugin.postcss = true as const

export default scaffoldInjectPlugin
