/**
 * commands/show-quick-pick.ts — show all mddeck commands in a quick pick.
 */

import * as vscode from 'vscode'

const commands = [
  { label: '$(export) Export Slide Deck...', command: 'markdown.mddeck.export' },
  { label: '$(new-file) New mddeck Markdown File', command: 'markdown.mddeck.newMddeckMarkdown' },
  { label: '$(settings) Open mddeck Extension Settings', command: 'markdown.mddeck.openExtensionsSettings' },
  { label: '$(zap) Toggle mddeck feature in current Markdown', command: 'markdown.mddeck.toggleMddeckFeature' },
]

export default {
  command: 'markdown.mddeck.showQuickPick',

  default: async () => {
    const picked = await vscode.window.showQuickPick(commands, {
      placeHolder: 'mddeck commands',
    })
    if (picked) {
      vscode.commands.executeCommand(picked.command)
    }
  },
}
