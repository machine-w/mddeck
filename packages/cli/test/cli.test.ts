/**
 * CLI integration tests — exercise the public API of @machine-w/mddeck-cli
 * (without spawning a subprocess or opening a browser).
 */

import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'

import { Converter, File } from '../src/index.js'

const FIXTURE = join(import.meta.dirname, 'fixtures', 'basic.md')

describe('Converter (HTML)', () => {
  it('converts a single markdown file to HTML', async () => {
    const file = new File(FIXTURE)
    await file.load()
    const converter = new Converter({ output: '/tmp/cli-test.html' })
    const out = await converter.convertFile(file)
    expect(out).toBe('/tmp/cli-test.html')
    const html = readFileSync(out, 'utf-8')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('id="impress"')
    expect(html).toContain('class="step')
    expect(html).toContain('impress-ready')
  })

  it('infers output type from .pdf extension', () => {
    const file = new File('test.md')
    expect(file.outputPath('/tmp/out.pdf', '.html')).toBe('/tmp/out.pdf')
  })

  it('honors an explicit output path verbatim', () => {
    const file = new File('test.md')
    expect(file.outputPath('/tmp/out.md', '.html')).toBe('/tmp/out.md')
  })

  it('derives default path from input file when no output is given', () => {
    const file = new File('/some/dir/notes.md')
    expect(file.outputPath(undefined, '.html')).toBe('/some/dir/notes.html')
  })
})

describe('File I/O', () => {
  it('File.load reads a markdown file', async () => {
    const file = new File(FIXTURE)
    const md = await file.load()
    expect(md).toContain('# Welcome to mddeck')
  })

  it('File.setContent works for stdin', () => {
    const file = new File()
    file.setContent('# Hello')
    expect(file.content).toBe('# Hello')
  })

  it('File.outputPath computes paths correctly', () => {
    const f1 = new File('/some/dir/notes.md')
    expect(f1.outputPath(undefined, '.html')).toBe('/some/dir/notes.html')

    const f2 = new File('/tmp/in.md')
    expect(f2.outputPath('/tmp/out.pdf', '.pdf')).toBe('/tmp/out.pdf')
  })
})
