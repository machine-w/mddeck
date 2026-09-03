/**
 * themes.ts — load user-configured custom themes from VS Code settings.
 *
 * VS Code users can configure custom CSS theme files via
 * `markdown.mddeck.themes` (array of file paths or URLs). We load each
 * one and inject them into the MdDeck instance as additional themes.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as vscode from 'vscode'

const mddeckConfig = () => vscode.workspace.getConfiguration('markdown.mddeck')

/**
 * Map of registered custom themes: name → CSS string.
 */
const themeCache = new Map<string, string>()

class Themes {
  /** Disposable handle for change listeners (none currently, but reserved). */
  dispose() {
    themeCache.clear()
  }

  /** Clear cached theme CSS (called when settings change). */
  clearCache() {
    themeCache.clear()
  }

  /**
   * Build the MdDeck theme-set extensions from user-configured themes.
   * Returns an empty object if no custom themes are configured.
   *
   * Custom themes can be referenced by `theme: <name>` in the front-matter,
   * where `<name>` is the basename of the configured file (without
   * extension).
   */
  async getMarpThemeSetFor(src: string): Promise<Record<string, unknown>> {
    // Read the theme name from the markdown front-matter
    const m = src.match(/^---\n([\s\S]*?)\n---/)
    const fm = m ? m[1] : ''
    const themeMatch = fm.match(/^theme:\s*(.+)$/m)
    if (!themeMatch) return {}
    const themeName = themeMatch[1].trim().replace(/^["']|["']$/g, '')

    // Built-in themes don't need a file
    if (['default', 'gaia', 'uncover', 'impress', 'impress-flat', 'impress-bare'].includes(themeName)) return {}

    // Look up user-configured theme files
    const themeFiles = mddeckConfig().get<string[]>('themes') ?? []
    for (const f of themeFiles) {
      const name = path.basename(f, path.extname(f))
      if (name === themeName) {
        const css = await this.loadTheme(f)
        // Note: returning CSS to be applied — the MdDeck doesn't have a
        // direct API for this yet, so we instead rely on the user's
        // theme CSS to override CSS variables.
        return { extraCss: css }
      }
    }
    return {}
  }

  /** Load a theme file (path or URL) and return its CSS. */
  private async loadTheme(file: string): Promise<string> {
    if (themeCache.has(file)) return themeCache.get(file)!
    try {
      let css: string
      if (file.startsWith('http://') || file.startsWith('https://')) {
        const res = await fetch(file)
        css = await res.text()
      } else {
        // Resolve relative paths against the workspace root
        let absPath = file
        if (!path.isAbsolute(absPath) && vscode.workspace.workspaceFolders?.[0]) {
          absPath = path.join(
            vscode.workspace.workspaceFolders[0].uri.fsPath,
            file,
          )
        }
        css = await fs.readFile(absPath, 'utf-8')
      }
      themeCache.set(file, css)
      return css
    } catch (err) {
      console.warn(`mddeck: failed to load theme "${file}":`, err)
      return ''
    }
  }
}

export const themes = new Themes()

// Export a `dispose` for cleanup
export default themes
