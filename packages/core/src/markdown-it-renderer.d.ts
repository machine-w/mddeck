/**
 * Type shim for `markdown-it/lib/renderer.mjs`. The marp-core modules import
 * `RenderRule` from this subpath; we re-export it via @types/markdown-it.
 */

declare module 'markdown-it/lib/renderer.mjs' {
  export type RenderRule = import('markdown-it').RenderRule
}
