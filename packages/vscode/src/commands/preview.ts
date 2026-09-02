/**
 * commands/preview.ts — render the current Markdown file as an
 * impress.js deck and open it in the system default browser via a
 * local HTTP server (127.0.0.1, OS-assigned port). The browser
 * polls the source URL with `fetch()` and reloads when the byte
 * size differs, giving live preview as the markdown changes.
 *
 * The HTTP server is bound to loopback only — never reachable from
 * the network. file:// URLs would have been simpler, but Chrome /
 * Firefox block fetch() from file:// origins, so polling against
 * file:// silently fails. http://127.0.0.1 makes the fetch same-
 * origin and the poller actually works.
 */

import * as vscode from 'vscode'
import * as path from 'node:path'
import { promises as fs } from 'node:fs'
import * as os from 'node:os'
import * as crypto from 'node:crypto'
import * as http from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { MdDeck } from '@machine-w/mddeck-core'

/** Active per-preview HTTP servers, keyed by the source URI hash.
 *  Each entry serves files from one previewDir on its own port.
 *  Kept at module level so multiple preview invocations of the same
 *  file reuse the same server (and the same port). */
interface LiveServer {
  dir: string
  server: http.Server
  port: number
}
const liveServers = new Map<string, LiveServer>()

/** Start (or reuse) a loopback HTTP server that serves files from
 *  `dir`. Returns the port number the OS assigned. The server stays
 *  alive for the lifetime of the extension; callers must `close()`
 *  it via `stopPreviewServer(key)` when the source document closes. */
async function startPreviewServer(key: string, dir: string): Promise<LiveServer> {
  const existing = liveServers.get(key)
  if (existing) return existing

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    // Treat "/" as "/index.html". Everything else is treated as a
    // file under dir. Refuse anything that escapes dir (basic
    // path-traversal guard — this server is loopback-only, but
    // belt-and-braces).
    const rel = url.pathname === '/' ? '/index.html' : url.pathname
    let filePath = path.join(dir, decodeURIComponent(rel))
    if (!filePath.startsWith(dir)) {
      res.statusCode = 403
      res.end()
      return
    }
    fs.readFile(filePath)
      .then((buf) => {
        const ext = path.extname(filePath).toLowerCase()
        const ct =
          ext === '.html' ? 'text/html; charset=utf-8'
          : ext === '.js' ? 'application/javascript; charset=utf-8'
          : ext === '.css' ? 'text/css; charset=utf-8'
          : ext === '.json' ? 'application/json; charset=utf-8'
          : 'application/octet-stream'
        res.setHeader('Content-Type', ct)
        // Crucial: prevent the browser from caching. Without this,
        // a quick edit+save might be masked by a 200 from disk cache
        // and the poller wouldn't notice.
        res.setHeader('Cache-Control', 'no-store')
        res.end(buf)
      })
      .catch(() => {
        res.statusCode = 404
        res.end()
      })
  })

  const port = await new Promise<number>((resolvePort) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      resolvePort(typeof addr === 'object' && addr ? addr.port : 0)
    })
  })

  const entry: LiveServer = { dir, server, port }
  liveServers.set(key, entry)
  return entry
}

function stopPreviewServer(key: string): void {
  const entry = liveServers.get(key)
  if (!entry) return
  liveServers.delete(key)
  // close() is idempotent; ignore errors from already-closed sockets.
  entry.server.close(() => {
    /* ignore */
  })
}

/** Inject a small polling <script> right before </html>. The script
 *  re-fetches the current page every second with cache: 'no-store'
 *  and compares the byte size to the previously seen one. If they
 *  differ, we reload the page — impress() then re-runs the new DOM
 *  and the user sees their edits live. */
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
  // NOTE: do NOT use html.replace('</body>', ...) or html.replace('</html>', ...).
  // impress.js's source bundles a string template (the impressConsole
  // script) that itself contains "</body></html>';" as part of its
  // stringified sub-document; any naive String.replace() call injects
  // our script *inside* the impress.js source string instead of after
  // it, breaking the parser. Anchor on the LAST occurrence of </html>
  // via lastIndexOf so we always splice in at the real document end.
  const idx = html.lastIndexOf('</html>')
  if (idx >= 0) {
    return html.slice(0, idx) + script + html.slice(idx)
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

    // Start (or reuse) the loopback HTTP server for this preview.
    // Binding to 127.0.0.1 keeps it off the network and avoids the
    // platform firewall nag; using port 0 lets the OS pick a free one.
    const entry = await startPreviewServer(key, previewDir)
    const previewUrl = `http://127.0.0.1:${entry.port}/`

    async function writePreview() {
      const markdown = await fs.readFile(targetUri.fsPath, 'utf-8')
      let html = await buildDeckHtml(markdown, targetUri.fsPath)
      html = injectUpdateScript(html)
      await fs.writeFile(previewPath, html, 'utf-8')
    }
    await writePreview()

    // Open in the system default browser via VSCode's openExternal.
    // The browser loads the loopback URL, executes impress().init()
    // and starts the polling loop. Because the URL is same-origin
    // (127.0.0.1:port), fetch() against location.href succeeds.
    await vscode.env.openExternal(vscode.Uri.parse(previewUrl))

    // Live updates: rewrite the preview file whenever the source
    // markdown changes. The HTTP server reads index.html on every
    // request, so the browser's polling loop picks up the new
    // content (different byte size → cache miss on the no-store
    // fetch) and triggers a reload via the injected <script>.
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
    // Stop rewriting the file and shut down the server when the
    // source is closed or renamed.
    const closeListener = vscode.workspace.onDidCloseTextDocument(
      (e) => {
        if (e.uri.toString() === targetUri.toString()) {
          clearTimeout(debounce)
          listener.dispose()
          closeListener.dispose()
          stopPreviewServer(key)
        }
      },
    )
  },
}