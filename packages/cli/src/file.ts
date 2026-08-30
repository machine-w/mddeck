/**
 * File I/O for mddeck CLI.
 *
 * Lightweight version of marp-cli's File class — handles stdin input,
 * file loading, and output path computation.
 */

import { readFile } from 'node:fs/promises'
import { resolve, dirname, basename, extname } from 'node:path'

export class File {
  /** Original file path (empty for stdin) */
  readonly path: string
  /** Loaded markdown content (lazy) */
  content: string | undefined
  /** Resolved absolute path */
  readonly absolutePath: string

  constructor(path = '') {
    this.path = path
    this.absolutePath = path ? resolve(path) : ''
  }

  /** Load file content. For stdin (path === ''), use `setContent`. */
  async load(): Promise<string> {
    if (this.path === '') {
      throw new Error('Cannot load from stdin with .load(). Use setContent().')
    }
    this.content = await readFile(this.path, 'utf-8')
    return this.content
  }

  /** Set content directly (for stdin). */
  setContent(c: string): void {
    this.content = c
  }

  /** Compute output path for a given extension. */
  outputPath(output?: string, ext = '.html'): string {
    if (output) return resolve(output)
    if (!this.path) return `mddeck-${Date.now()}${ext}`
    const dir = dirname(this.path)
    const name = basename(this.path, extname(this.path))
    return resolve(dir, `${name}${ext}`)
  }
}

export async function loadFiles(args: string[]): Promise<File[]> {
  return Promise.all(
    args.map(async (p) => {
      const f = new File(p)
      await f.load()
      return f
    }),
  )
}
