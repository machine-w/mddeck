/**
 * commands/toggle-mddeck-feature.ts — toggle `mddeck: true` in the current
 * Markdown file's front-matter to enable/disable mddeck rendering.
 */

import * as vscode from 'vscode'

export default {
  command: 'markdown.mddeck.toggleMddeckFeature',

  default: async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showErrorMessage('No active editor.')
      return
    }

    const doc = editor.document
    const text = doc.getText()
    // Match front-matter
    const fmMatch = text.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) {
      // No front-matter — insert one
      const insert = '---\nmddeck: true\n---\n\n'
      await editor.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(0, 0), insert)
      })
      vscode.window.showInformationMessage('Added front-matter with mddeck: true')
      return
    }

    // Toggle mddeck line
    const fmBody = fmMatch[1]
    const hasEnabled = /^mddeck:\s*true/m.test(fmBody)
    const newFmBody = hasEnabled
      ? fmBody.replace(/^mddeck:\s*true/m, 'mddeck: false')
      : fmBody + '\nmddeck: true'

    const newFm = `---\n${newFmBody}\n---`
    const range = new vscode.Range(
      doc.positionAt(0),
      doc.positionAt(fmMatch[0].length),
    )
    await editor.edit((editBuilder) => {
      editBuilder.replace(range, newFm)
    })
    vscode.window.showInformationMessage(
      hasEnabled ? 'Disabled mddeck for this file' : 'Enabled mddeck for this file',
    )
  },
}
