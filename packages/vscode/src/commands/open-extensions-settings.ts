/**
 * commands/open-extensions-settings.ts — open the mddeck settings tab.
 */

import * as vscode from 'vscode'

export default {
  command: 'markdown.mddeck.openExtensionsSettings',

  default: () => {
    vscode.commands.executeCommand(
      'workbench.action.openSettings',
      'markdown.mddeck',
    )
  },
}
