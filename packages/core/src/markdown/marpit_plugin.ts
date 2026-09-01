/**
 * marpitPlugin helper — wraps @marp-team/marpit's CJS plugin factory so that
 * ESM source files can use it as `marpitPlugin(myFn)`.
 *
 * The marpit package ships its plugin factory at `@marp-team/marpit/plugin`.
 * It works fine with static `import` in ESM mode; we previously used
 * `createRequire` as a workaround, but that doesn't work inside a CJS
 * bundle (the extension's bundle replaces `import.meta` with `{}`).
 *
 * Use a static import so the bundler can inline this dependency.
 */

import { marpPlugin as marpitPluginFn } from '@marp-team/marpit/plugin'
export const marpitPlugin = (marpitPluginFn.default ?? marpitPluginFn) as <P extends any[]>(
  plugin: (...args: any[]) => any,
) => (...args: any[]) => any
