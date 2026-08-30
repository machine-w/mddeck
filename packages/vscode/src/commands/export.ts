/**
 * commands/export.ts — Export Slide Deck command.
 *
 * Opens a save dialog, then shells out to the `mddeck` CLI (which the user
 * is expected to have installed globally or locally as a devDependency).
 *
 * We do NOT statically depend on @machine-w/mddeck-cli: bundling it (and
 * its ~200 MB of transitive deps, including puppeteer-core) would bloat
 * the VSIX and trigger vsce's "case-insensitive path" error from
 * npm file: symlinks. Spawning the CLI as a subprocess is the
 * marp-vscode pattern too — see the historical version.
 */

import * as vscode from 'vscode'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { spawn } from 'node:child_process'

/**
 * Resolve the `mddeck` executable. Looks in:
 *   1. The `mddeck` binary in PATH (when @machine-w/mddeck-cli is installed
 *      globally)
 *   2. The workspace's `node_modules/.bin/mddeck` (when installed locally)
 *   3. The extension's bundled `node_modules/.bin/mddeck` (when the user
 *      has the CLI installed alongside this extension)
 */
async function findMddeckBinary(): Promise<string | undefined> {
  // 1. PATH lookup via `which`
  try {
    const { spawnSync } = await import('node:child_process')
    const r = spawnSync('which', ['mddeck'])
    if (r.status === 0 && r.stdout.toString().trim()) {
      return r.stdout.toString().trim()
    }
  } catch {}

  // 2 & 3. Local node_modules/.bin/mddeck
  const workspaceFolders = vscode.workspace.workspaceFolders
  const candidates: string[] = []
  if (workspaceFolders) {
    for (const folder of workspaceFolders) {
      candidates.push(path.join(folder.uri.fsPath, 'node_modules', '.bin', 'mddeck'))
    }
  }
  // Also check the extension's own node_modules (e.g. if user installed both)
  candidates.push(path.join(__dirname, '..', 'node_modules', '.bin', 'mddeck'))

  for (const p of candidates) {
    try {
      await fs.access(p)
      return p
    } catch {}
  }
  return undefined
}

async function runCli(
  markdown: string,
  output: string,
  type: 'html' | 'pdf',
): Promise<number> {
  const bin = await findMddeckBinary()
  if (!bin) {
    throw new Error(
      'mddeck CLI not found. Install it with: `npm install -g @machine-w/mddeck-cli`',
    )
  }
  const tmpDir = os.tmpdir()
  const tmpFile = path.join(tmpDir, `mddeck-export-${Date.now()}.md`)
  await fs.writeFile(tmpFile, markdown, 'utf-8')

  const args = [tmpFile, '--output', output]
  if (type === 'pdf') args.push('--pdf')

  return new Promise<number>((resolve, reject) => {
    const child = spawn(bin, args, { stdio: 'inherit' })
    child.on('close', (code) => {
      fs.unlink(tmpFile).catch(() => {})
      resolve(code ?? 1)
    })
    child.on('error', (err) => {
      fs.unlink(tmpFile).catch(() => {})
      reject(err)
    })
  })
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
