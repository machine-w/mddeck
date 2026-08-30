/**
 * utils.ts — shared helpers for the mddeck VS Code extension.
 */

import * as vscode from 'vscode'

export const mddeckConfiguration = () =>
  vscode.workspace.getConfiguration('markdown.mddeck')

export const mathTypesettingConfiguration = (): 'off' | 'katex' | 'mathjax' => {
  return mddeckConfiguration().get<'off' | 'katex' | 'mathjax'>(
    'mathTypesetting',
    'katex',
  )
}
