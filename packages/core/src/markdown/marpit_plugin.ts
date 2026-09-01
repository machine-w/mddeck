/**
 * marpitPlugin helper — wraps @marp-team/marpit's CJS plugin factory so that
 * ESM source files can use it as `marpitPlugin(myFn)`.
 *
 * The @marp-team/marpit package.json has no `exports` field for the
 * `/plugin` subpath, so esbuild leaves `require('@marp-team/marpit/plugin')`
 * as a dynamic require that the .vsix can't resolve. Import the package's
 * main entry (which exports `marpPlugin`) and pull it off there.
 */

import { marpPlugin as _marpPlugin } from '@marp-team/marpit'
const marpPlugin = (_marpPlugin as any).default ?? _marpPlugin
export const marpitPlugin = marpPlugin as <P extends any[]>(
  plugin: (...args: any[]) => any,
) => (...args: any[]) => any
