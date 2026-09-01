/**
 * mddeck for VS Code — extension entry point.
 *
 * Registers the standalone mddeck commands (export, preview,
 * new-file, settings, etc.). The Markdown preview is NOT a markdown-it
 * plugin: instead, "mddeck: Preview Slide Deck" opens a dedicated
 * webview panel that renders the current file as an impress.js deck.
 */

import * as vscode from 'vscode'

import { themes } from './themes.js'
import {
  exportCommand,
  newMddeckMarkdownCommand,
  openExtensionsSettingsCommand,
  previewSlideDeckCommand,
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
      previewSlideDeckCommand.command,
      // Capture the ExtensionContext in the handler closure. We can't
      // rely on `this` because the command object's `default` is called
      // by VS Code without a `this` binding.
      (uri?: vscode.Uri) => previewSlideDeckCommand.default(uri, context),
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
        themes.clearCache()
      }
    }),
  )
}

export function deactivate() {
  themes.dispose()
}
