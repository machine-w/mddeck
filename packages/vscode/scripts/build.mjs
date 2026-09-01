/**
 * scripts/build.mjs — bundle the entire VSCode extension with esbuild.
 */

import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { readFile } from 'node:fs/promises'

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
  // The cross-package @machine-w/mddeck-core import is a symlink
  // (../../packages/core) which esbuild treats as an external
  // dependency — it won't inline across the symlink boundary.
  // Force it through the source path so all the .ts files in
  // @mddeck/core get bundled. The esbuild `alias` field is only
  // available in newer versions; emulate it via onResolve below.
  plugins: [
    {
      name: 'mddeck-aliases',
      setup(build) {
        // @machine-w/mddeck-core → packages/core/src/ (instead of
        // the symlinked dist/, which esbuild treats as external).
        build.onResolve(
          { filter: /^@machine-w\/mddeck-core$/ },
          () => ({
            path: resolve(
              __dirname,        // packages/vscode/scripts/
              '..', '..', '..',  // → monorepo root
              'packages',
              'core',
              'src',
            ),
          }),
        )
        // Pre-load the marpit CJS subpath file (and its inner
        // lib/plugin) so it gets inlined into the bundle. The vendored
        // @mddeck/core files do `require('@marp-team/marpit/plugin')`,
        // which esbuild would otherwise leave as a dynamic require that
        // the .vsix can't resolve (it ships no node_modules).
        build.onLoad(
          { filter: /node_modules\/@marp-team\/marpit\/plugin\.js$/ },
          async (args) => {
            const contents = await readFile(args.path, 'utf8')
            return { contents, loader: 'js' }
          },
        )
        build.onLoad(
          { filter: /node_modules\/@marp-team\/marpit\/lib\/plugin\.js$/ },
          async (args) => {
            const contents = await readFile(args.path, 'utf8')
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
