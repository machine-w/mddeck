/**
 * commands/new-mddeck-markdown.ts — create a new .md file pre-populated
 * with the mddeck front-matter.
 */

import * as vscode from 'vscode'

const TEMPLATE = `---
theme: default
width: 1920
height: 1080
perspective: 1000
transitionDuration: 800
---

# Welcome to mddeck

A **markdown-first** slide deck engine that produces 3D presentations
powered by [impress.js](https://impress.js).

---

# Slide 2

Add a new slide with a horizontal rule (\`---\`).

---

<!-- _position: { x: 1500, y: 0 } -->

# Offset slide

This slide is offset 1500px to the right.
`

export default {
  command: 'markdown.mddeck.newMddeckMarkdown',

  default: async (uri?: vscode.Uri) => {
    const target = uri ?? vscode.workspace.workspaceFolders?.[0]?.uri
    const fileUri = await vscode.window.showSaveDialog({
      defaultUri: target
        ? vscode.Uri.file(`${target.fsPath}/untitled.md`)
        : undefined,
      filters: { 'Markdown': ['md'] },
      title: 'New mddeck Markdown File',
    })
    if (!fileUri) return
    await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(TEMPLATE))
    await vscode.window.showTextDocument(fileUri)
  },
}
