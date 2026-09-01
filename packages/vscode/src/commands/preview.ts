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
import { MdDeck } from '@machine-w/mddeck-core'

/** Build the impress.js deck HTML for a markdown source.
 *  Used for both the initial render and for the auto-refresh script
 *  that the browser polls. */
async function buildDeckHtml(markdown: string, sourcePath: string): Promise<string> {
  const deck = new MdDeck()
  // renderDocument produces a complete single-file HTML document with
  // impress.js source inlined (because we don't pass an
  // impressJsBundle, it falls back to a runtime error — that's
  // fine here, we'll strip the runtime script before writing the file
  // and inject our own).
  const fullHtml = await deck.renderDocument({
    markdown,
    title: path.basename(sourcePath, '.md'),
    author: '',
    impressJsBundle: '',
    extraCss: '',
  })
  // The impress init script that renderDocument emits tries to set
  // body.impress-ready after a short delay. That's fine for a static
  // HTML; we'll add our own update script on top of it.
  return fullHtml
}

/** Strip the impress init <script> that renderDocument emits (the
 *  one that calls impress().init()) and inject our own update script
 *  that:
 *    1. Calls impress().init() on first load
 *    2. Polls ?v=<hash> every second; when the hash changes, fetches
 *       the new <body> contents and replaces it via impress().init()
 *       (which re-reads the slides) without a full page reload.
 *
 *  The cache-bust query is supplied by the extension host when it
 *  rewrites the file. The browser just appends ?v=… to the URL, so
 *  the file system always serves the new copy. */
function injectUpdateScript(html: string): string {
  return html.replace(
    /<script>[\s\S]*?impress\(\)\.init[\s\S]*?<\/script>/,
    /* html */ `<script>
(function () {
  function boot() {
    try {
      var api = impress();
      api.init();
      document.body.classList.remove('impress-not-supported');
      document.body.classList.add('impress-ready');
    } catch (e) {
      console.error('mddeck preview: init failed', e);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  // Live updates: re-fetch the same file with a cache-busting query
  // string and re-initialise impress() with the new slides. impress()
  // re-reads the slides from the DOM on init, so the keyboard
  // navigation handlers get re-bound.
  setInterval(async function () {
    try {
      var res = await fetch(location.pathname + '?_=' + Date.now(), {
        cache: 'no-store',
      });
      if (!res.ok) return;
      var txt = await res.text();
      // Pull the new <div id="impress"> inner HTML out of the response.
      var m = txt.match(/<div id="impress"[^>]*>([\s\S]*?)<\/div>\s*<script>/);
      if (!m) return;
      document.getElementById('impress').innerHTML = m[1];
      var api = impress();
      api.init();
    } catch (e) {
      console.error('mddeck preview: update failed', e);
    }
  }, 1000);
})();
</script>`,
  )
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
