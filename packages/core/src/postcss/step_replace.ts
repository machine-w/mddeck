/**
 * PostCSS plugin: replace `section` with `.step` in the packed CSS.
 *
 * Marpit's default scaffold theme and built-in directive processing still
 * emit `section { ... }` rules. Since mddeck rewrites Marpit's `<section>`
 * slide tokens into `<div class="step">`, we need the CSS to target `.step`
 * instead. This plugin rewrites `section` → `.step` in selectors (with care
 * to leave nested rules alone).
 */

import type { PluginCreator } from 'postcss'

const stepReplacePlugin: PluginCreator<never> = () => {
  return {
    postcssPlugin: 'mddeck-step-replace',
    Once(root) {
      root.walkRules((rule) => {
        // Skip rules that are not targeting "section"
        rule.selectors = rule.selectors.map((selector) => {
          // Only replace bare `section` (not `.section` or `#section` etc.)
          return selector.replace(/(^|[\s>+~])(section)(?=[\s.:#>+~[\],]|$)/g, '$1.step')
        })
      })
    },
  }
}
stepReplacePlugin.postcss = true as const

export default stepReplacePlugin
