/**
 * @machine-w/mddeck-core compatibility layer for code copied from
 * @marp-team/marp-core.
 *
 * The marp-core modules expect `marpPlugin` (a wrapper for markdown-it
 * plugins that checks `md.marpit` exists). This file re-exports it
 * under the name `marpPlugin` (note double-p, matching the vendored
 * marp-core API) so the vendored plugins can keep their imports
 * unchanged.
 *
 * The factory lives at `@marp-team/marpit/plugin.js` (a CJS subpath,
 * NOT the main entry, which only exports the `Marpit` class). This
 * deep import works because marpit has no `exports` field — Node's
 * legacy deep-import resolution finds the file regardless of install
 * depth.
 *
 * FRAGILITY: if @marp-team/marpit ever adds an `exports` field that
 * does not include `./plugin`, this deep import will stop resolving.
 * See packages/core/src/markdown/marpit_plugin.ts for the full
 * remediation options.
 */

import type { Marpit as MarpitType } from '@marp-team/marpit'
import marpPluginMod from '@marp-team/marpit/plugin.js'
const marpPluginFn = (marpPluginMod as any).default ?? marpPluginMod
export const marpPlugin = marpPluginFn as <P extends any[]>(
  plugin: (...args: any[]) => any,
) => (...args: any[]) => any

/** Type alias matching @marp-team/marp-core's `Marp` class shape. */
export type Marp = MarpitType