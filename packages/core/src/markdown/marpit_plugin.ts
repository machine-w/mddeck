/**
 * marpitPlugin helper — wraps @marp-team/marpit's CJS plugin factory so that
 * ESM source files can use it as `marpitPlugin(myFn)`.
 *
 * The factory lives at `@marp-team/marpit/plugin.js` (a CJS subpath, NOT
 * the main entry, which only exports the `Marpit` class). We import it
 * directly with normal module resolution — this works because marpit
 * has no `exports` field in its package.json, so Node's legacy
 * deep-import resolution finds `/plugin.js` regardless of install
 * depth (workspace hoisting, npm install, or esbuild bundling).
 *
 * FRAGILITY: if @marp-team/marpit ever adds an `exports` field that
 * does not include `./plugin`, this deep import will stop resolving.
 * The remediation in that case is one of:
 *   1. File an upstream PR adding `./plugin` to marpit's `exports`.
 *   2. Vendor the `marpitPlugin` function source into this package
 *      (it's ~15 lines — copies over from `node_modules/@marp-team/
 *      marpit/lib/plugin.js`).
 *   3. Use `createRequire(import.meta.url).require('@marp-team/marpit
 *      /plugin.js')` and rely on a manual `node_modules` lookup.
 *
 * See packages/core/src/marpp_plugin.ts for the sibling shim used by
 * the vendored marp-core plugins (math, emoji, slug, size, etc.).
 */

import marpPluginMod from '@marp-team/marpit/plugin.js'
const marpPlugin = (marpPluginMod as any).default ?? marpPluginMod
export const marpitPlugin = marpPlugin as <P extends any[]>(
  plugin: (...args: any[]) => any,
) => (...args: any[]) => any