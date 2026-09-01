/**
 * commands/preview.ts — open an mddeck slide deck preview in a
 * dedicated webview, instead of trying to hijack VS Code's built-in
 * Markdown preview (which requires the extension to act as a
 * markdown-it plugin and breaks with module-mode bundling).
 *
 * The webview shows a single-file impress.js deck generated from the
 * currently active Markdown document.
 */

import * as vscode from 'vscode'
import * as path from 'node:path'
import { promises as fs } from 'node:fs'
import { renderPreviewHtml } from '../preview-template.js'

export default {
  command: 'markdown.mddeck.previewSlideDeck',
  // command name kept for backwards compat; also bound via package.json
  // contributes.contextMenus.markdown.editor to the right-click menu
  // as 'mddeck: Preview Slide Deck'.

  default: async (uri?: vscode.Uri) => {
    // Use passed URI or fall back to the active editor.
    const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri
    if (!targetUri) {
      vscode.window.showErrorMessage(
        'No active Markdown editor. Open a .md file and try again.',
      )
      return
    }
    if (!targetUri.fsPath.endsWith('.md')) {
      vscode.window.showErrorMessage(
        'mddeck preview only works on .md files.',
      )
      return
    }

    let markdown: string
    try {
      markdown = await fs.readFile(targetUri.fsPath, 'utf-8')
    } catch (err) {
      vscode.window.showErrorMessage(
        `Failed to read file: ${(err as Error).message}`,
      )
      return
    }

    // Pick a column for the webview (right side of the editor).
    const viewColumn =
      vscode.window.activeTextEditor?.viewColumn === vscode.ViewColumn.One
        ? vscode.ViewColumn.Two
        : vscode.ViewColumn.One

    const panel = vscode.window.createWebviewPanel(
      'mddeckPreview',
      `mddeck — ${path.basename(targetUri.fsPath)}`,
      viewColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    )
    panel.webview.html = await renderPreviewHtml(markdown, targetUri.fsPath)
  },
}
