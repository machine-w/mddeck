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
  // In a CJS bundle, `import.meta` is `{}`, so `import.meta.url` is
  // undefined. Three modules in @mddeck/core use
  // `createRequire(import.meta.url)` to load CJS sub-paths; without a
  // valid file:// URL they throw "filename must be a file URL object,
  // file URL string, or absolute path string".
  //
  // esbuild's `define` only accepts JSON or identifier values, so we
  // can't use a runtime expression. Instead, we polyfill
  // `import.meta` via a banner that captures the bundle's own
  // __filename and exposes it through `globalThis.importMetaURL`.
  // The vendored modules' `import.meta.url` then reads
  // `globalThis.importMetaURL` via esbuild's identifier replacement.
  banner: {
    js: [
      "var __import_meta_url__ = require('url').pathToFileURL(__filename).href;",
      "globalThis.importMetaURL = __import_meta_url__;",
    ].join("\n"),
  },
  define: {
    'import.meta.url': 'globalThis.importMetaURL',
  },
  // The marpit package's package.json has no `exports` field for the
  // `/plugin` subpath, so esbuild treats it as a dynamic require that
  // can't be inlined. The .vsix doesn't ship node_modules, so that
  // dynamic require throws at runtime. Force the marpit CJS subpath
  // to be inlined into the bundle by aliasing it to the on-disk
  // location that esbuild CAN resolve.
  alias: {
    // 'plugin' redirects to plugin.js (the CJS entry).
    '@marp-team/marpit/plugin': resolve(
      __dirname,
      '..',
      '..',
      '..',
      'node_modules',
      '@marp-team',
      'marpit',
      'plugin.js',
    ),
    // The cross-package @machine-w/mddeck-core import is a symlink
    // (../../packages/core) which esbuild treats as an external
    // dependency — it won't inline across the symlink boundary.
    // Force it through the source path so all the .ts files in
    // @mddeck/core get bundled (including marpp_plugin.ts which
    // still does `require('@marp-team/marpit/plugin')`).
    '@machine-w/mddeck-core': resolve(__dirname, '..', 'core', 'src'),
  },
  // Allow esbuild to resolve dependencies from the monorepo root's
  // node_modules. Without this, packages that are only referenced via
  // aliases (like @marp-team/marpit/plugin) might not be resolvable.
  nodePaths: [resolve(__dirname, '..', '..', '..', 'node_modules')],
  // Don't bundle 'vscode' (it's injected by VSCode's extension host).
  // 'electron' is sometimes an indirect dep — keep external.
  external: ['vscode', 'electron'],
  logLevel: 'info',
})

console.log('Bundled dist/extension.js')
