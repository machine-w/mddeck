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
  // @mddeck/core get bundled (including marpp_plugin.ts which
  // still does `require('@marp-team/marpit/plugin')`).
  '@machine-w/mddeck-core': resolve(
    __dirname,        // packages/vscode/scripts/
    '..', '..', '..',  // → packages/ → mddeck/ → monorepo root
    'packages',
    'core',
    'src',
  ),
  // esbuild plugin: pre-load the marpit CJS subpath file so it gets
  // inlined into the bundle. The vendored @mddeck/core files import
  // `@marp-team/marpit/plugin` (a subpath whose package.json has no
  // `exports` field), and esbuild would otherwise leave it as a
  // dynamic require that the .vsix can't resolve. The plugin file
  // requires `./lib/plugin` which we also pre-load so the whole
  // chain is bundled.
  plugins: [
    {
      name: 'marpit-plugin-inline',
      setup(build) {
        // Resolve the bare specifier '@marp-team/marpit/plugin' to
        // the on-disk plugin.js file.
        build.onResolve(
          { filter: /^@marp-team\/marpit\/plugin$/ },
          () => ({
            path: resolve(
              __dirname,
              '..', '..', '..',  // → monorepo root
              'node_modules',
              '@marp-team',
              'marpit',
              'plugin.js',
            ),
          }),
        )
        // Load the plugin.js file (which re-requires lib/plugin
        // internally; onLoad below will inline lib/plugin too).
        build.onLoad(
          { filter: /node_modules\/@marp-team\/marpit\/plugin\.js$/ },
          async (args) => {
            const contents = await readFile(args.path, 'utf8')
            return { contents, loader: 'js' }
          },
        )
        // Inline the inner lib/plugin file (the real marpPlugin).
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
