/**
 * @machine-w/mddeck-core compatibility layer for code copied from @marp-team/marp-core.
 *
 * The marp-core modules expect two things:
 *   1. `marpPlugin` factory — wrapper for markdown-it plugins that checks
 *      `md.marpit` exists before calling the inner plugin.
 *   2. The `Marp` class type — used by math/emoji/slug/size/etc. plugins to
 *      access `marpit.themeSet`, custom directives, etc.
 *
 * We provide both here so the vendored marp-core modules can be used without
 * modification of their `import { Marp } from '../marp'` lines.
 */

import type { Marpit as MarpitType } from '@marp-team/marpit'
// @marp-team/marpit's main entry only exports the `Marpit` class
// (not `marpPlugin`). The plugin factory lives in a CJS subpath
// (`@marp-team/marpit/plugin`) whose package.json has no `exports`
// field. esbuild's dynamic require would fail at .vsix runtime
// (no node_modules), so we import the on-disk file directly via
// a `mddeck/core`-relative path through the monorepo root.
import marpPluginMod from '../../node_modules/@marp-team/marpit/plugin.js'
const marpPluginFn = (marpPluginMod as any).default ?? marpPluginMod
export const marpPlugin = marpPluginFn as <P extends any[]>(
  plugin: (...args: any[]) => any,
) => (...args: any[]) => any

/** Type alias matching @marp-team/marp-core's `Marp` class shape.
 *  We don't actually need the full Marp class — most vendored modules only
 *  use it as an opaque type to access `md.marpit` (which is a real Marpit).
 */
export type Marp = MarpitType
