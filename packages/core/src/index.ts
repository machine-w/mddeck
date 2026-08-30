/**
 * @machine-w/mddeck-core — public entry point.
 *
 * Exports:
 *   - `MdDeck`            Main class extending Marpit
 *   - `builtinThemes`     The default theme set (default / gaia / uncover)
 *   - `registerDirectives` Register mddeck directives onto an existing Marpit
 *   - `mddeckImpress`     The standalone markdown-it plugin
 */

export { MdDeck } from './mddeck.js'
export type { MdDeckOptions } from './mddeck.js'

export { builtinThemes, scaffoldCss, scaffoldMeta } from './themes/index.js'
export type { MddeckTheme } from './themes/index.js'

export { registerDirectives } from './markdown/directives.js'
export { mddeckImpress } from './markdown/impress.js'
export { autoLayoutPlugin } from './markdown/auto_layout.js'
export { printModePlugin } from './markdown/print_mode.js'

// Re-export useful Marpit types so consumers don't need to depend on marpit directly
export { Element, Theme, ThemeSet } from '@marp-team/marpit'
export type { RenderResult, DirectiveDefinitions } from '@marp-team/marpit'
// Marpit.Options lives inside a TypeScript namespace merged into the class.
// Re-export it as a type alias for consumers.
export type MarpitOptions = {
  anchor?: boolean | ((index: number) => string)
  container?: false | Record<string, unknown> | Record<string, unknown>[]
  cssContainerQuery?: boolean | string | string[]
  cssNesting?: boolean
  headingDivider?: false | number | number[]
  lang?: string
  looseYAML?: boolean
  markdown?: unknown
  printable?: boolean
  slideContainer?: false | Record<string, unknown> | Record<string, unknown>[]
  inlineSVG?: boolean | { enabled?: boolean; backdropSelector?: boolean }
}
