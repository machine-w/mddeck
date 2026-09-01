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

  default: async (uri?: vscode.Uri, context?: vscode.ExtensionContext) => {
    const ext = context
    // Use passed URI or fall back to the active editor.
    const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri
    if (!targetUri) {
      vscode.window.showErrorMessage(
        'No active Markdown editor. Open a .md file and try again.',
      )
      return
    }
    if (!context) {
      vscode.window.showErrorMessage(
        'mddeck: extension context not available. Please reload the window.',
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
        // Allow the webview to load the bundled impress.js + preview
        // runtime from the extension's media/ directory. Without this,
        // the webview's content security policy blocks the
        // <script src="vscode-resource://..."> tags and impress never
        // initialises.
        localResourceRoots: [vscode.Uri.joinPath(
          context.extensionUri, 'media',
        )],
      },
    )
    const initialHtml = await renderPreviewHtml(
      markdown,
      targetUri.fsPath,
      context,
    )
    panel.webview.html = initialHtml

    // Live updates: re-render the deck when the markdown document
    // changes and push the new slides HTML to the webview.
    let debounceTimer: NodeJS.Timeout | undefined
    const updateListener = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() !== targetUri.toString()) return
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
          const newMarkdown = e.document.getText()
          const newHtml = await renderPreviewHtml(
            newMarkdown,
            targetUri.fsPath,
            context,
          )
          // Re-render to get the new slides HTML.
          const m = newHtml.match(
            /<div id="impress"[^>]*>([\s\S]*?)<\/div>\s*<script>/,
          )
          const slidesHTML = m ? m[1] : ''
          panel.webview.postMessage({
            type: 'update',
            slidesHTML,
          })
        }, 250)
      },
    )

    // Clean up the debounced listener when the panel closes.
    panel.onDidDispose(() => {
      clearTimeout(debounceTimer)
      updateListener.dispose()
    })
  },
}
