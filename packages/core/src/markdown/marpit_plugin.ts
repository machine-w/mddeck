/**
 * marpitPlugin helper — wraps @marp-team/marpit's CJS plugin factory so that
 * ESM source files can use it as `marpitPlugin(myFn)`.
 *
 * The @marp-team/marpit package.json has no `exports` field for the
 * `/plugin` subpath, so esbuild leaves `require('@marp-team/marpit/plugin')`
 * as a dynamic require that the .vsix can't resolve. Import the package's
 * main entry (which exports `marpPlugin`) and pull it off there.
 */

// @marp-team/marpit's main entry only exports the `Marpit` class
// (not `marpPlugin`). The plugin factory lives in a CJS subpath
// (`@marp-team/marpit/plugin`) whose package.json has no `exports`
// field. esbuild's dynamic require would fail at .vsix runtime
// (no node_modules), so we import the on-disk file directly via
// a `mddeck/core`-relative path through the monorepo root.
// @ts-ignore - relative path to workspace node_modules
import marpPluginMod from '../../../node_modules/@marp-team/marpit/plugin.js'
const marpPlugin = (marpPluginMod as any).default ?? marpPluginMod
export const marpitPlugin = marpPlugin as <P extends any[]>(
  plugin: (...args: any[]) => any,
) => (...args: any[]) => any
