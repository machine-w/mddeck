/**
 * mddeck for VS Code — extension entry point.
 *
 * Hooks into VS Code's built-in Markdown preview by returning a custom
 * `extendMarkdownIt(md)` function from `activate()`. VS Code calls this
 * function on every Markdown file's markdown-it instance, giving us a
 * chance to swap in the mddeck renderer.
 */

import * as vscode from 'vscode'

import { mddeckCoreOptionForPreview } from './option.js'
import { themes } from './themes.js'
import {
  exportCommand,
  newMddeckMarkdownCommand,
  openExtensionsSettingsCommand,
  showQuickPickCommand,
  toggleMddeckFeatureCommand,
} from './commands/index.js'

export function activate(context: vscode.ExtensionContext) {
  // Register commands
  context.subscriptions.push(
    themes,
    vscode.commands.registerCommand(exportCommand.command, exportCommand.default),
    vscode.commands.registerCommand(
      newMddeckMarkdownCommand.command,
      newMddeckMarkdownCommand.default,
    ),
    vscode.commands.registerCommand(
      openExtensionsSettingsCommand.command,
      openExtensionsSettingsCommand.default,
    ),
    vscode.commands.registerCommand(
      showQuickPickCommand.command,
      showQuickPickCommand.default,
    ),
    vscode.commands.registerCommand(
      toggleMddeckFeatureCommand.command,
      toggleMddeckFeatureCommand.default,
    ),
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('markdown.mddeck.themes')) {
        // Theme list changed — re-register and refresh previews
        themes.clearCache()
        await vscode.commands.executeCommand('markdown.preview.refresh')
      }
    }),
  )

  // Return the extendMarkdownIt hook — VS Code's built-in Markdown
  // extension will call this for each Markdown file's markdown-it
  // instance. We swap in the mddeck renderer.
  return {
    extendMarkdownIt: mddeckCoreOptionForPreview,
  }
}

export function deactivate() {
  themes.dispose()
}
