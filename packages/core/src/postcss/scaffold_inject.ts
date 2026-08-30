/**
 * PostCSS plugin: inject mddeck scaffold CSS into the packed theme output.
 *
 * Why: Marpit's theme system has its own internal `scaffold` theme that gets
 * injected automatically by `themeSet.pack()`. We can't easily replace it
 * with our own scaffold (which uses `.step` selectors and mddeck CSS vars).
 * So we inject our scaffold as a PostCSS plugin that runs after the theme
 * pack — our scaffold CSS lands at the end of the final stylesheet, taking
 * precedence over Marpit's default scaffold.
 */

import type { PluginCreator } from 'postcss'
import { scaffoldCss } from '../themes/scaffold.js'

const scaffoldInjectPlugin: PluginCreator<never> = () => {
  return {
    postcssPlugin: 'mddeck-scaffold-inject',
    Once(root) {
      root.append(scaffoldCss)
    },
  }
}
scaffoldInjectPlugin.postcss = true as const

export default scaffoldInjectPlugin
