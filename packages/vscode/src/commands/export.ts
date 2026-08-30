/**
 * commands/export.ts — Export Slide Deck command.
 *
 * Opens a save dialog, then shells out to `@machine-w/mddeck-cli` to do the actual
 * rendering. Replaces marp-vscode's `doExport` which called marp-cli.
 */

import * as vscode from 'vscode'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { mddeckConfiguration } from '../utils.js'

interface ExportOptions {
  /** 'html' or 'pdf' */
  type: 'html' | 'pdf'
  /** File filter for the save dialog */
  filter: vscode.DocumentFilter
}

/**
 * Run @machine-w/mddeck-cli via dynamic import. We use the published `marpCli`
 * function (re-exported as `cliInterface` in our package).
 */
async function runCli(
  markdown: string,
  output: string,
  type: 'html' | 'pdf',
): Promise<number> {
  const { cliInterface } = await import('@machine-w/mddeck-cli')
  // Write markdown to a temp file
  const tmpDir = await import('node:os').then((m) => m.tmpdir())
  const tmpFile = path.join(tmpDir, `mddeck-export-${Date.now()}.md`)
  await fs.writeFile(tmpFile, markdown, 'utf-8')
  try {
    const args: string[] = [tmpFile]
    args.push('--output', output)
    if (type === 'pdf') args.push('--pdf')
    return await cliInterface(args)
  } finally {
    await fs.unlink(tmpFile).catch(() => {})
  }
}

export default {
  command: 'markdown.mddeck.export',

  default: async (uri?: vscode.Uri, allUris?: vscode.Uri[]) => {
    const targets = (allUris ?? (uri ? [uri] : [])).filter(Boolean) as vscode.Uri[]
    if (targets.length === 0) {
      vscode.window.showErrorMessage('No active editor to export.')
      return
    }

    const config = mddeckConfiguration()
    const defaultType = (config.get<string>('exportType') ?? 'html') as 'html' | 'pdf'

    for (const target of targets) {
      const doc = await vscode.workspace.openTextDocument(target)
      const markdown = doc.getText()

      // Ask the user for HTML vs PDF
      const typeChoice = await vscode.window.showQuickPick(
        [
          { label: 'HTML', description: 'Single-file HTML deck (default)', value: 'html' as const },
          { label: 'PDF', description: 'PDF export (requires Chromium)', value: 'pdf' as const },
        ],
        { placeHolder: `Export ${path.basename(target.fsPath)} as…` },
      )
      if (!typeChoice) return

      const ext = typeChoice.value === 'pdf' ? 'pdf' : 'html'
      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(
          target.fsPath.replace(/\.md$/, `.${ext}`),
        ),
        filters: typeChoice.value === 'pdf'
          ? { 'PDF Document': ['pdf'] }
          : { 'HTML Deck': ['html'] },
      })
      if (!saveUri) return

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Exporting ${path.basename(target.fsPath)} as ${ext.toUpperCase()}…`,
        },
        async () => {
          try {
            const exitCode = await runCli(markdown, saveUri.fsPath, typeChoice.value)
            if (exitCode !== 0) {
              vscode.window.showErrorMessage(
                `mddeck: export failed (exit code ${exitCode})`,
              )
              return
            }
            const autoOpen = config.get<boolean>('exportAutoOpen', true)
            if (autoOpen) {
              vscode.env.openExternal(saveUri)
            }
            vscode.window.showInformationMessage(
              `Exported to ${saveUri.fsPath}`,
            )
          } catch (err: any) {
            vscode.window.showErrorMessage(`mddeck export failed: ${err.message ?? err}`)
          }
        },
      )
    }
  },
}
