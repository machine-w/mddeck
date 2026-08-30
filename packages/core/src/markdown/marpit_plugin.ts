/**
 * marpitPlugin helper — wraps @marp-team/marpit's CJS plugin factory so that
 * ESM source files can use it as `marpitPlugin(myFn)`.
 *
 * The marpit package ships its plugin factory at `@marp-team/marpit/plugin`
 * but its package.json has no `exports` field, so Node's ESM resolver can't
 * resolve the subpath. We use createRequire to load it via the classic
 * CommonJS algorithm instead.
 */

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const marpitPluginMod = require('@marp-team/marpit/plugin')
export const marpitPlugin = (marpitPluginMod.default ?? marpitPluginMod) as <P extends any[]>(
  plugin: (...args: any[]) => any,
) => (...args: any[]) => any
