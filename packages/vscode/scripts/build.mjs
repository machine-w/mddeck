/**
 * scripts/build.mjs — bundle the entire VSCode extension with esbuild.
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
  // CJS bundle polyfill for `import.meta` (see comments in the banner).
  banner: {
    js: [
      "var __import_meta_url__ = require('url').pathToFileURL(__filename).href;",
      "globalThis.importMetaURL = __import_meta_url__;",
    ].join("\n"),
  },
  define: {
    'import.meta.url': 'globalThis.importMetaURL',
  },
  // esbuild plugin: intercept `require('@marp-team/marpit/plugin')` and
  // resolve to the on-disk plugin.js file, then return the file contents
  // as a CommonJS module. This works around the fact that
  // @marp-team/marpit has no `exports` field for the `/plugin` subpath
  // (esbuild won't inline it as part of the bundle).
  plugins: [
    {
      name: 'marpit-plugin-inline',
      setup(build) {
        build.onResolve({ filter: /@marp-team\/marpit\/plugin$/ }, () => ({
          path: resolve(
            __dirname,
            '..',
            '..',
            '..',
            'node_modules',
            '@marp-team',
            'marpit',
            'plugin.js',
          ),
        }))
        // Also handle the case where the source uses
        // `import * as marpit from '@marp-team/marpit'` and pulls
        // marpPlugin off the namespace.
        build.onResolve({ filter: /@marp-team\/marpit\/lib\/plugin$/ }, () => ({
          path: resolve(
            __dirname,
            '..',
            '..',
            '..',
            'node_modules',
            '@marp-team',
            'marpit',
            'lib',
            'plugin.js',
          ),
        }))
      },
    },
  ],
  // 'vscode' is injected by VSCode's extension host at runtime.
  // 'electron' is sometimes an indirect dep — keep external.
  external: ['vscode', 'electron'],
  logLevel: 'info',
})
