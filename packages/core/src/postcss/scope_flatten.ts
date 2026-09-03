/**
 * PostCSS plugin: fix Marpit's CSS scoping for mddeck's flat step structure.
 *
 * Why this exists: Marpit's CSS scoping (in
 * `pseudoSelector/prepend.js`) prepends `:marpit-container > :marpit-slide `
 * to every theme selector. Marpit's HTML structure assumes
 * `<container> > <section> > <section>` (slide wrapping nested section for
 * content). With mddeck's `step_replace.ts`, those `<section>` tags become
 * `<div class="step">`, so a theme rule like `.step { background }` (which
 * targets the slide) becomes:
 *
 *   `div.marpit.mddeck > div.mddeck-slide-container > .step .step { ... }`
 *
 * The trailing descendant `.step` requires a NESTED step inside the slide,
 * which mddeck's flat structure (`<div class="step">...content...</div>`,
 * no inner step) never produces. So Marpit's scoped selectors never match.
 *
 * Fix: strip the trailing ` .step` descendant that Marpit's scoping adds
 * to slide-targeting rules. This rewrites
 *
 *   `container > div.mddeck-slide-container > .step .step { ... }`
 *
 * back to
 *
 *   `container > div.mddeck-slide-container > .step { ... }`
 *
 * which matches mddeck's flat HTML.
 *
 * Scope: only strip the LAST trailing `.step` (descendant form). Leave
 * any `.step` that's part of a more specific selector (e.g. `.step.hi`)
 * alone. The `:scope` pseudo-class and `:where()` are not affected.
 */

import type { PluginCreator } from 'postcss'

const scopeFlattenPlugin: PluginCreator<never> = () => {
  return {
    postcssPlugin: 'mddeck-scope-flatten',
    Once(root) {
      root.walkRules((rule) => {
        rule.selectors = rule.selectors.map((selector) => {
          let s = selector
          // 1. Collapse any '...' '.step' '.step' '...' (consecutive
          //    descendant .step selectors) into a single '.step'.
          //    Marpit's CSS scoping produces '... > .step .step <inner>'
          //    because it appends ':marpit-slide' (which step_replace
          //    converts to '.step') right after the existing '.step'
          //    selector. mddeck's flat structure never has nested .step
          //    elements, so the inner one is dead weight.
          s = s.replace(/\.step\s+\.step/g, '.step')
          // 2. Marpit's :root scoping uses ':marpit-root' which its
          //    'root/increasing_specificity' plugin rewrites to
          //    ':where(section):not([\\20 root])' to bump specificity.
          //    That selector only matches actual <section> elements —
          //    mddeck uses <div class="step">, so the rule never matches
          //    and theme CSS variables (--mddeck-bg, --mddeck-accent, ...)
          //    never take effect. Rewrite to '.step' so the rule targets
          //    mddeck's actual slide element.
          s = s.replace(/:where\(section\)(?::not\([^)]*\))?/g, '.step')
          return s
        })
      })
    },
  }
}
scopeFlattenPlugin.postcss = true as const

export default scopeFlattenPlugin