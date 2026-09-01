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
// The @marp-team/marpit package.json has no `exports` field for the
// `/plugin` subpath, and esbuild won't inline dynamic require()s in a
// CJS bundle (the .vsix ships no node_modules to resolve them at
// runtime). Import the package's main entry instead and pick out the
// already-exported `marpPlugin` symbol.
import * as marpit from '@marp-team/marpit'
const marpPluginFn = (marpit as any).marpPlugin ?? (marpit as any).default?.marpPlugin
export const marpPlugin = marpPluginFn as <P extends any[]>(
  plugin: (...args: any[]) => any,
) => (...args: any[]) => any

/** Type alias matching @marp-team/marp-core's `Marp` class shape.
 *  We don't actually need the full Marp class — most vendored modules only
 *  use it as an opaque type to access `md.marpit` (which is a real Marpit).
 */
export type Marp = MarpitType
