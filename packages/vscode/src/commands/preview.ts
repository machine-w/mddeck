/**
 * commands/preview.ts — render the current Markdown file as an
 * impress.js deck and open it in the system default browser (via
 * `vscode.env.openExternal`). The browser polls the source file via
 * a `setInterval` for changes, and swaps the slides HTML in place
 * without re-initialising impress.js (so the keyboard state, current
 * step, etc. are preserved).
 */

import * as vscode from 'vscode'
import * as path from 'node:path'
import { promises as fs } from 'node:fs'
import * as os from 'node:os'
import * as crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { MdDeck } from '@machine-w/mddeck-core'

/** Inject a small polling <script> right before </body>. The script
 *  re-fetches the current page every second with cache: 'no-store' and
 *  compares the byte size to the previously seen one. If they differ,
 *  we reload the page — impress() then re-runs the new DOM and the user
 *  sees their edits live. */
function injectUpdateScript(html: string): string {
  const script = `
<script>
(function () {
  var lastLength = -1;
  function check() {
    fetch(location.href, { cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (text) {
        if (lastLength === -1) { lastLength = text.length; return; }
        if (text.length !== lastLength) { location.reload(); }
      })
      .catch(function () { /* ignore */ });
  }
  setInterval(check, 1000);
})();
</script>
`
  if (html.includes('</body>')) {
    return html.replace('</body>', script + '</body>')
  }
  return html + script
}

/** Build the impress.js deck HTML for a markdown source.
 *  Reads impress.js from the bundled media/ directory and passes
 *  its source to renderDocument's impressJsBundle so the deck includes
 *  a working <script> tag in the static HTML. */
async function buildDeckHtml(markdown: string, sourcePath: string): Promise<string> {
  // In a bundled CJS, import.meta.url is replaced via the define
  // option with globalThis.importMetaURL (see scripts/build.mjs banner).
  // At runtime in the extension host that resolves to a file:// URL
  // pointing at the bundle's directory.
  const url = (import.meta as any).url as string
  const bundleDir = dirname(fileURLToPath(url))
  const impressJs = await fs.readFile(
    resolve(bundleDir, '..', 'media', 'impress.js'),
    'utf-8',
  )

  const deck = new MdDeck()
  return await deck.renderDocument({
    markdown,
    title: path.basename(sourcePath, '.md'),
    author: '',
    impressJsBundle: impressJs,
    extraCss: '',
  })
}

export default {
  command: 'markdown.mddeck.previewSlideDeck',
  default: async (uri?: vscode.Uri, context?: vscode.ExtensionContext) => {
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

    // Write the preview HTML to a per-file path under the system
    // tmp directory. The directory name is hashed from the source
    // path so different files don't clobber each other.
    const key = crypto
      .createHash('sha1')
      .update(targetUri.toString())
      .digest('hex')
      .slice(0, 12)
    const previewDir = path.join(
      os.tmpdir(),
      `mddeck-preview-${key}`,
    )
    const previewPath = path.join(previewDir, 'index.html')
    await fs.mkdir(previewDir, { recursive: true })

    async function writePreview() {
      const markdown = await fs.readFile(targetUri.fsPath, 'utf-8')
      let html = await buildDeckHtml(markdown, targetUri.fsPath)
      html = injectUpdateScript(html)
      await fs.writeFile(previewPath, html, 'utf-8')
    }
    await writePreview()

    // Open in the system default browser via VSCode's openExternal.
    // The browser will load file://...index.html, which executes
    // impress().init() and starts the polling loop.
    await vscode.env.openExternal(vscode.Uri.file(previewPath))

    // Live updates: rewrite the preview file whenever the source
    // markdown changes. The browser's polling loop will pick up the
    // new content (different file size → cache miss on the no-store
    // fetch) and re-init impress() with the new slides.
    let debounce: NodeJS.Timeout | undefined
    const listener = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() !== targetUri.toString()) return
        clearTimeout(debounce)
        debounce = setTimeout(() => {
          writePreview().catch((err) =>
            console.error('mddeck preview: rewrite failed', err),
          )
        }, 250)
      },
    )
    // Stop rewriting the file when the source is closed or renamed.
    const closeListener = vscode.workspace.onDidCloseTextDocument(
      (e) => {
        if (e.uri.toString() === targetUri.toString()) {
          clearTimeout(debounce)
          listener.dispose()
          closeListener.dispose()
        }
      },
    )
  },
}
