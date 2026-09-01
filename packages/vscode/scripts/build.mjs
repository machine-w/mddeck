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
  // resolve to the on-disk plugin.js file. We use onResolve + onLoad
  // so esbuild can statically bundle the CJS file. This works around
  // the fact that @marp-team/marpit has no `exports` field for the
  // `/plugin` subpath, and esbuild's alias field alone wasn't enough
  // for the dynamic require() that our vendored modules use.
  plugins: [
    {
      name: 'marpit-plugin-inline',
      setup(build) {
        build.onResolve(
          { filter: /^@marp-team\/marpit\/plugin$/ },
          () => ({
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
            namespace: 'file',
          }),
        )
        // Pre-load the plugin.js content as a CommonJS module so its
        // `module.exports = require('./lib/plugin')` is also bundled
        // (lib/plugin is the actual marpPlugin factory).
        build.onLoad(
          { filter: /marpit[\\\/]plugin\.js$/, namespace: 'file' },
          async (args) => {
            const fs = await import('node:fs/promises')
            const contents = await fs.readFile(args.path, 'utf8')
            return { contents, loader: 'js' }
          },
        )
      },
    },
  ],
  // 'vscode' is injected by VSCode's extension host at runtime.
  // 'electron' is sometimes an indirect dep — keep external.
  external: ['vscode', 'electron'],
  logLevel: 'info',
})
