/**
 * scripts/build.mjs — bundle the entire VSCode extension with esbuild.
 *
 * One entry, one output, one source map: dist/extension.js.
 * Bundles @machine-w/mddeck-core so the .vsix has no runtime deps.
 *
 * This avoids the headaches of:
 *   - tsc's per-file output requiring many files in the .vsix
 *   - vsce's "case-insensitive path" error from npm file: symlinks
 *   - missing-files errors when .vsix's dist/ subdirs are incomplete
 */

import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

await build({
  entryPoints: [resolve(root, 'src/extension.ts')],
  bundle: true,
  format: 'cjs',
  target: 'es2022',
  platform: 'node',
  outfile: resolve(root, 'dist/extension.js'),
  sourcemap: true,
  // In CJS bundles, `import.meta.url` evaluates to `{}` (an empty object).
  // Three of our vendored modules use `createRequire(import.meta.url)`
  // to load CJS sub-paths; without a valid URL string that throws
  // 'filename must be a file URL object, file URL string, or absolute
  // path string'. We inject a banner that defines a `__filename` for
  // the bundle so the marpit plugin can fall back to that.
  banner: { js: "var __filename = __filename || require('url').pathToFileURL(__dirname || '.').href;" },
  // Don't bundle 'vscode' (it's injected by VSCode's extension host).
  // 'electron' is sometimes an indirect dep — keep external.
  external: ['vscode', 'electron'],
  logLevel: 'info',
})

console.log('Bundled dist/extension.js')
