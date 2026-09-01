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
  // CJS bundle: `import.meta` is `{}`, so `import.meta.url` is undefined
  // and `createRequire(import.meta.url)` throws. @mddeck/core's vendored
  // modules use this pattern. Replace `import.meta.url` with a file://
  // URL pointing at the bundle's directory so the marpit CJS sub-paths
  // resolve correctly at extension-host runtime.
  define: {
    'import.meta.url': 'require("url").pathToFileURL(__filename).href',
  },
  // Don't bundle 'vscode' (it's injected by VSCode's extension host).
  // 'electron' is sometimes an indirect dep — keep external.
  external: ['vscode', 'electron'],
  logLevel: 'info',
})

console.log('Bundled dist/extension.js')
