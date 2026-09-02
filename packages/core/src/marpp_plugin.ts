/**
 * @machine-w/mddeck-core compatibility layer for code copied from @marp-team/marp-core.
 *
 * The marp-core modules expect `marpPlugin` (a wrapper for markdown-it
 * plugins that checks `md.marpit` exists).
 */

import type { Marpit as MarpitType } from '@marp-team/marpit'
// @marp-team/marpit's main entry only exports the `Marpit` class
// (not `marpPlugin`). The plugin factory lives in a CJS subpath
// (`@marp-team/marpit/plugin`) whose package.json has no `exports`
// field. esbuild's dynamic require would fail at .vsix runtime
// (no node_modules), so we import the on-disk file directly via
// a `mddeck/core`-relative path through the monorepo root.
/**
 * Import the marpit plugin factory via Node's normal module resolution
 * instead of a relative path. marpit ships its plugin factory at
 * `@marp-team/marpit/plugin.js` and has no `exports` field, so Node's
 * legacy deep-import resolution finds it regardless of install depth
 * (workspace hoisting, npm install, or esbuild bundling).
 */
import marpPluginMod from '@marp-team/marpit/plugin.js'
const marpPluginFn = (marpPluginMod as any).default ?? marpPluginMod
export const marpPlugin = marpPluginFn as <P extends any[]>(
  plugin: (...args: any[]) => any,
) => (...args: any[]) => any

/** Type alias matching @marp-team/marp-core's `Marp` class shape. */
export type Marp = MarpitType
