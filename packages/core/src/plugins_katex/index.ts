/**
 * mddeck KaTeX plugin — registers the KaTeX math library with the
 * marp-core-compatible math framework inside @mddeck/core.
 *
 * Usage:
 *   import { MdDeck } from '@mddeck/core'
 *   import { katexMarpCorePlugin } from '@mddeck/core/katex'
 *   const md = new MdDeck({ math: 'katex' })
 *   md.use(katexMarpCorePlugin())
 *
 * This file is a near-verbatim copy of @marp-team/marp-core's katex plugin,
 * with two adaptations:
 *   1. SCSS `?inline` import replaced with a plain CSS string
 *   2. `#marp-katex` alias replaced with direct `katex` package import
 */

import type { KatexOptions } from 'katex'
import { isEnabledAutoScaling } from '../auto-scaling/utils.js'
import { getMathLibrary, registerMathLibrary } from '../math/context.js'
import type { MathLibraryObject } from '../math/context.js'
import { normalizeMathOptions } from '../math/options.js'
import { marpPlugin } from '../marpp_plugin.js'
import katexCss from './katex-css.js'

// Pull the katex package directly (instead of via marp-core's #marp-katex alias)
import * as katexPkg from 'katex'

export interface KaTeXMarpCorePluginOptions {
  options?: KatexOptions
  fontPath?: string | false
}

export const katexMarpCorePlugin = ({
  options,
  fontPath,
}: KaTeXMarpCorePluginOptions = {}) => {
  const katexUrlMatcher = /url\(['"]?fonts\/(.*?)['"]?\)/g

  return marpPlugin((md) => {
    const { marpit: marp } = md

    const fallback = (tokens, idx) => {
      const { content, markup } = tokens[idx]
      return md.utils.escapeHtml(`${markup}${content}${markup}`)
    }

    const getKaTeXOptions = () => {
      if (options) return options
      const opts = normalizeMathOptions((marp as any)._mddeckMathOption ?? (marp as any).options?.math)
      return (opts && (opts.katexOption as KatexOptions)) || undefined
    }

    const render: typeof katexPkg.renderToString = (tex, opts) => {
      const lib = getMathLibrary(marp, 'katex') as MathLibraryObject<{
        macros?: KatexOptions['macros']
      }>
      return katexPkg.renderToString(tex, {
        throwOnError: false,
        ...getKaTeXOptions(),
        macros: lib?.context?.macros || {},
        ...opts,
      })
    }

    registerMathLibrary(marp, 'katex', {
      css: (marp) => {
        const fontPathOption =
          fontPath ??
          (() => {
            const opts = normalizeMathOptions(
              (marp as any)._mddeckMathOption ?? (marp as any).options?.math,
            )
            return (opts && opts.katexFontPath) ?? undefined
          })()

        if (fontPathOption === false) return katexCss

        const newFontPath =
          fontPathOption ||
          `https://cdn.jsdelivr.net/npm/katex@${katexPkg.version}/dist/fonts/`

        return katexCss.replace(
          katexUrlMatcher,
          (_, matched) => `url('${newFontPath}${matched}')`,
        )
      },
      inlineRenderer: () => (tokens, idx) => {
        const { content } = tokens[idx]
        try {
          return render(content, { displayMode: false })
        } catch (e) {
          console.warn(e)
          return fallback(tokens, idx)
        }
      },
      blockRenderer: () => (tokens, idx) => {
        const { content } = tokens[idx]
        try {
          let rendered = render(content, { displayMode: true })
          // mddeck doesn't use inlineSVG, so skip the marp-span wrapping
          return `<p>${rendered}</p>`
        } catch (e) {
          console.warn(e)
          return `<p>${fallback(tokens, idx)}</p>`
        }
      },
      initializeContext: () => ({
        macros: { ...getKaTeXOptions()?.macros },
      }),
    })
  })
}

export default katexMarpCorePlugin
