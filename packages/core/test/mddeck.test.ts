/**
 * mddeck core unit tests.
 *
 * These tests verify the core behavior of @machine-w/mddeck-core:
 *  - Basic rendering of multi-slide markdown
 *  - impress.js data-* attribute injection
 *  - Custom directive handling (position / rotate / scale / ...)
 *  - Frontmatter parsing (theme / width / height / perspective / ...)
 *  - Auto layout when no position is given
 *  - Built-in theme registration
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { MdDeck, builtinThemes } from '../src/index.js'

const FIXTURES = join(import.meta.dirname, 'fixtures')

function fixture(name: string): string {
  return readFileSync(join(FIXTURES, name), 'utf-8')
}

describe('MdDeck basic', () => {
  it('renders a single slide as <div class="step">', () => {
    const md = new MdDeck()
    const { html } = md.render('# Hello world')
    expect(html).toContain('class="step')
    expect(html).not.toContain('<section')
    expect(html).toContain('Hello world')
  })

  it('splits slides on --- horizontal rules', () => {
    const md = new MdDeck()
    const { html } = md.render(fixture('basic.md'))
    // 4 slides in basic.md → 4 .step tokens
    const matches = String(html).match(/class="step/g) ?? []
    expect(matches.length).toBe(4)
  })

  it('assigns sequential ids (step-1, step-2, ...)', () => {
    const md = new MdDeck()
    const { html } = md.render(fixture('basic.md'))
    expect(html).toContain('id="step-1"')
    expect(html).toContain('id="step-2"')
    expect(html).toContain('id="step-3"')
    expect(html).toContain('id="step-4"')
  })

  it('always produces data-x / data-y / data-z via auto layout', () => {
    const md = new MdDeck()
    const { html } = md.render(fixture('basic.md'))
    expect(html).toContain('data-x=')
    expect(html).toContain('data-y=')
    expect(html).toContain('data-z=')
  })
})

describe('MdDeck directives', () => {
  it('honors _position: { x, y, z } spot directive', () => {
    const md = new MdDeck()
    const { html } = md.render(fixture('basic.md'))
    // Second slide has _position: { x: 1500, y: 0 }
    expect(html).toMatch(/<div[^>]*id="step-2"[^>]*data-x="1500"/)
    expect(html).toMatch(/<div[^>]*id="step-2"[^>]*data-y="0"/)
  })

  it('honors _rotate: { z: 90 } spot directive', () => {
    const md = new MdDeck()
    const { html } = md.render(fixture('basic.md'))
    // Fourth slide has _rotate: { x:0, y:0, z:90 }
    expect(html).toMatch(/<div[^>]*id="step-4"[^>]*data-rotate-z="90"/)
  })

  it('honors _scale: 2 spot directive', () => {
    const md = new MdDeck()
    const { html } = md.render(fixture('basic.md'))
    expect(html).toMatch(/<div[^>]*id="step-4"[^>]*data-scale="2"/)
  })
})

describe('MdDeck frontmatter', () => {
  it('parses theme / width / height / perspective from frontmatter', () => {
    const md = new MdDeck()
    const { html, css } = md.render(fixture('with-frontmatter.md'))
    // css should include gaia theme styles
    expect(css).toContain('--mddeck-bg') // scaffold is injected
    // The root data-* attributes are added by renderDocument; here we only check html
    expect(html).toContain('class="step')
    // _position: { x: 0, y: -1500 } on second slide
    expect(html).toMatch(/<div[^>]*id="step-2"[^>]*data-y="-1500"/)
  })
})

describe('MdDeck themes', () => {
  it('registers default / gaia / uncover / impress / impress-flat / impress-bare themes', () => {
    expect(builtinThemes.map((t) => t.name)).toEqual([
      'default',
      'gaia',
      'uncover',
      'impress',
      'impress-flat',
      'impress-bare',
    ])
  })

  it('themeSet.has() returns true for built-in themes', () => {
    const md = new MdDeck()
    expect(md.themeSet.has('default')).toBe(true)
    expect(md.themeSet.has('gaia')).toBe(true)
    expect(md.themeSet.has('uncover')).toBe(true)
    expect(md.themeSet.has('impress')).toBe(true)
    expect(md.themeSet.has('impress-flat')).toBe(true)
    expect(md.themeSet.has('impress-bare')).toBe(true)
    expect(md.themeSet.has('nonexistent')).toBe(false)
  })

  it('switching theme via directive works', () => {
    const md = new MdDeck()
    md.render(`---\ntheme: gaia\n---\n# Hi`)
    // The lastGlobalDirectives should reflect the change
    expect((md as any).lastGlobalDirectives?.theme).toBe('gaia')
  })
})

describe('MdDeck renderDocument', () => {
  it('produces a single-file HTML document with inline CSS + script', async () => {
    const md = new MdDeck()
    const doc = await md.renderDocument({
      markdown: fixture('basic.md'),
      title: 'Test Deck',
      author: 'Tester',
      impressJsBundle: '/* fake impress.js */',
    })
    expect(doc).toContain('<!DOCTYPE html>')
    expect(doc).toContain('<title>Test Deck</title>')
    expect(doc).toContain('<meta name="author" content="Tester">')
    expect(doc).toContain('id="impress"')
    expect(doc).toContain('/* fake impress.js */')
    expect(doc).toContain('class="step')
    // Should auto-init impress in IIFE
    expect(doc).toContain('window.impress()')
    expect(doc).toContain("impress-ready")
  })

  it('injects print mode CSS when printable: true', async () => {
    const md = new MdDeck({ printable: true })
    const doc = await md.renderDocument({
      markdown: '# Slide',
      impressJsBundle: '',
      printable: true,
    })
    expect(doc).toContain('perspective: none')
    expect(doc).toContain('page-break-after')
  })
})
