/**
 * Stub re-export for code copied from @marp-team/marp-core.
 *
 * The marp-core modules reference this file via `import type { Marp } from '../marp'`.
 * For mddeck we treat `Marp` as an alias for our `MdDeck` class (which extends
 * Marpit, the underlying framework), but vendored modules only need it as an
 * opaque type for type-checking purposes.
 */

export type { Marp } from './marpp_plugin.js'
