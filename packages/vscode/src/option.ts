/**
 * option.ts — Build the options object for the mddeck core instance
 * that powers VS Code's Markdown preview.
 *
 * VS Code calls `extendMarkdownIt(md)` for each Markdown file. We hook
 * into `md.render` to detect mddeck-marked files and replace the output
 * with our impress.js renderer.
 *
 * Adapted from marp-vscode/src/option.ts (which used Marp / Marp Core).
 */

import * as vscode from 'vscode'
import type MarkdownIt from 'markdown-it'
import { MdDeck } from '@mddeck/core'
import { themes } from './themes.js'

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
        const result = deck.render(src)
        // Wrap in a div and inject the style block so markdown-it's output
        // pipeline is happy with our HTML
        return (
          `<style id="__mddeck-style">${result.css}</style>\n` +
          String(result.html)
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

/**
 * Get the markdown.mddeck.html config (sanitized for untrusted workspaces).
 */
export function getHtmlOption(): boolean | 'all' {
  if (!vscode.workspace.isTrusted) return false
  const conf = mddeckConfig().get<string>('html')
  if (conf === 'all') return 'all'
  if (conf === 'off') return false
  return true
}

/**
 * Get the markdown.mddeck.mathTypesetting config.
 */
export function getMathOption(): false | 'katex' | 'mathjax' {
  const v = mddeckConfig().get<'off' | 'katex' | 'mathjax'>('mathTypesetting') ?? 'katex'
  if (v === 'off') return false
  return v
}
