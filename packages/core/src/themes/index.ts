/**
 * mddeck themes registry.
 *
 * Each theme exports a CSS string with a Marpit-compatible metadata header
 * (`/*! @theme <name> *\/`). The MdDeck class auto-registers all themes here
 * on construction so they can be selected via the front-matter
 * `theme: <name>` directive.
 */

import { scaffoldCss, scaffoldMeta } from './scaffold.js'
import defaultThemeCss from './default.js'
import gaiaThemeCss from './gaia.js'
import uncoverThemeCss from './uncover.js'
import impressThemeCss from './impress.js'
import impressFlatThemeCss from './impress-flat.js'
import impressBareThemeCss from './impress-bare.js'

export interface MddeckTheme {
  name: string
  css: string
}

/** Built-in themes registered by default on every MdDeck instance. */
export const builtinThemes: MddeckTheme[] = [
  { name: 'default', css: defaultThemeCss },
  { name: 'gaia', css: gaiaThemeCss },
  { name: 'uncover', css: uncoverThemeCss },
  { name: 'impress', css: impressThemeCss },
  { name: 'impress-flat', css: impressFlatThemeCss },
  { name: 'impress-bare', css: impressBareThemeCss },
]

/** The scaffold CSS that gets prepended to every theme's CSS. */
export { scaffoldCss, scaffoldMeta }
