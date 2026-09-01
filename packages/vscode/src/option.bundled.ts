/**
 * option.bundled.ts — same as option.ts but inlines @machine-w/mddeck-core
 * so the .vsix has no runtime dep to resolve.
 *
 * Built by scripts/build.mjs via esbuild.
 */

import type * as vscodeTypes from 'vscode'
import type MarkdownIt from 'markdown-it'
import { MdDeck } from '@machine-w/mddeck-core'
import { themes } from './themes.js'

declare const vscode: typeof vscodeTypes
const mddeckConfig = () => vscode.workspace.getConfiguration('markdown.mddeck')

/**
 * Detect whether a markdown source uses mddeck by looking for `marp: true`
 * or `mddeck: true` (or just any `theme:` directive) in the front-matter.
 */
function detectMddeckFromMarkdown(src: string): boolean {
  const m = src.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return false
  const fm = m[1]
  return /\b(theme|marp|mddeck)\s*:/m.test(fm)
}

/**
 * VS Code's extendMarkdownIt hook. Replaces `md.render` to detect mddeck
 * files and produce impress.js HTML instead of vanilla markdown.
 */
export const mddeckCoreOptionForPreview = (md: MarkdownIt): MarkdownIt => {
  const originalRender = md.render.bind(md)

  md.render = function (src: string, env?: any): string {
    if (detectMddeckFromMarkdown(src)) {
      try {
        // Build a deck with workspace theme overrides
        const deck = new MdDeck({})
        // Sync render: katex is lazy-loaded async, but for preview we want
        // instant feedback. If katex isn't loaded yet, the formula will
        // show as raw LaTeX for this first render and improve on subsequent.
        const tokens = md.markdown.parse(src, env)
        const html = deck.render(tokens)
        // Wrap in a div and inject the style block so markdown-it's output
        // pipeline is happy with our HTML
        return (
          `<style id="__mddeck-style">${html.css}</style>\n` +
          String(html.html)
        )
      } catch (err) {
        console.error('mddeck: render failed; falling back to standard markdown', err)
        return originalRender(src, env)
      }
    }
    return originalRender(src, env)
  } as typeof md.render

  return md
}

// Re-export so extension.ts can find the import
export { themes }
