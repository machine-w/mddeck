/**
 * scripts/build.mjs — bundle the VSCode extension with esbuild.
 *
 * The vsce package step doesn't include any of our `node_modules` deps
 * (we strip dependencies to keep the VSIX small — puppeteer-core alone
 * is ~25 MB). For the @machine-w/mddeck-core dep that option.ts needs
 * at runtime, we esbuild-bundle it into a single dist/option.bundled.js
 * so the extension has no `node_modules` import to resolve.
 */

import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

await build({
  entryPoints: [resolve(root, 'src/option.bundled.ts')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'node',
  outfile: resolve(root, 'dist/option.bundled.js'),
  sourcemap: true,
  // Don't bundle node built-ins as externals (we want everything inlined
  // except those). markdown-it, marpit etc. all get inlined.
  external: ['vscode', 'electron'],
  logLevel: 'info',
})

console.log('Bundled dist/option.bundled.js')
