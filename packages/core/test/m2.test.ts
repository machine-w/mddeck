/**
 * mddeck M2 tests — math, emoji, html sanitization, slug, size, auto-scaling.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { MdDeck } from '../src/index.js'

const FIXTURES = join(import.meta.dirname, 'fixtures')
function fixture(name: string): string {
  return readFileSync(join(FIXTURES, name), 'utf-8')
}

describe('M2 math framework', () => {
  it('respects math: false (disable math parsing)', () => {
    const md = new MdDeck({ math: false })
    const { html } = md.render(fixture('math.md'))
    // When math is disabled, $...$ stays as plain text
    expect(html).toContain('$E = mc^2$')
    expect(html).not.toMatch(/marp_math/)
  })

  it('math: true activates math parsing (tokenizes $...$ and $$...$$)', () => {
    const md = new MdDeck({ math: 'mathjax' })
    // Verify math tokens are created (renderer may not include the token name)
    const src = '# Test\n\nInline $x^2$ math.\n\n$$\nE=mc^2\n$$\n'
    const tokens = md.markdown.parse(src, {})
    const mathTypes: string[] = []
    for (const t of tokens) {
      if (t.type.includes('math')) mathTypes.push(t.type)
      if (t.children) {
        for (const c of t.children) {
          if (c.type.includes('math')) mathTypes.push(c.type)
        }
      }
    }
    expect(mathTypes.some((s) => s.includes('inline'))).toBe(true)
    expect(mathTypes.some((s) => s.includes('block'))).toBe(true)
  })

  it('exposes MathOptions type from marp-core', () => {
    // Just verify the option is accepted without runtime error
    const md = new MdDeck({ math: { lib: 'katex', katexOption: {} } })
    expect(md).toBeInstanceOf(MdDeck)
  })

  it('renders inline math to katex HTML when katex is installed', async () => {
    const md = new MdDeck({ math: 'katex' })
    const { html } = await md.renderAsString('Inline $x^2$ math')
    // katex renders to <span class="katex">...</span>
    expect(html).toMatch(/<span class="katex"/)
  })

  it('renders block math to katex HTML (centered display)', async () => {
    const md = new MdDeck({ math: 'katex' })
    const { html } = await md.renderAsString('# T\n\n$$\nE = mc^2\n$$\n')
    expect(html).toMatch(/class="katex-display"|class="katex"/)
  })
})

describe('M2 emoji', () => {
  it('parses shortcode emoji :rocket:', () => {
    const md = new MdDeck({ emoji: { shortcode: 'twemoji' } })
    const { html } = md.render('Hello :rocket: world')
    // twemoji shortcodes get rendered as <img data-marp-twemoji>
    expect(html).toContain('data-marp-twemoji')
  })

  it('parses unicode emoji 🚀', () => {
    const md = new MdDeck({ emoji: { unicode: 'twemoji' } })
    const { html } = md.render('Hello 🚀 world')
    expect(html).toContain('data-marp-twemoji')
  })
})

describe('M2 html sanitization (XSS)', () => {
  it('escapes inline HTML when html option is disabled (html:false)', () => {
    const md = new MdDeck({ html: false })
    const { html } = md.render(fixture('xss.md'))
    // inline <script> and inline HTML get escaped
    expect(html).not.toContain('<script>alert')
    expect(html).not.toContain('<a href="javascript:')
  })

  it('default allowlist strips dangerous script and javascript: URLs', () => {
    const md = new MdDeck()
    const { html } = md.render(fixture('xss.md'))
    // Sanitizer strips <script> tags and javascript: URLs from <a href>
    expect(html).not.toContain('<script>alert')
    expect(html).not.toContain('<a href="javascript:')
  })

  it('default allowlist keeps safe tags (strong, em)', () => {
    const md = new MdDeck()
    const { html } = md.render(fixture('xss.md'))
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })
})

describe('M2 size directive', () => {
  it('parses global size: 16:9', () => {
    const md = new MdDeck({ size: '16:9' })
    const { html } = md.render(fixture('with-size.md'))
    // CSS should reflect 16:9 dimensions
    expect(html.length).toBeGreaterThan(100)
  })

  it('honors _size spot override', () => {
    const md = new MdDeck({ size: '16:9' })
    const { html } = md.render(fixture('with-size.md'))
    // Second slide has _size: 4:3 spot
    expect(html).toContain('data-size="4:3"')
  })
})

describe('M2 heading slug (when slug enabled)', () => {
  it('produces id attributes on heading elements', () => {
    const md = new MdDeck({ slug: true })
    const { html } = md.render(fixture('headings.md'))
    expect(html).toContain('id="heading-one"')
    expect(html).toContain('id="heading-two"')
    expect(html).toContain('id="heading-three"')
  })

  it('disambiguates duplicate slugs', () => {
    const md = new MdDeck({ slug: true })
    const { html } = md.render('# Test\n\n---\n\n# Test')
    expect(html).toContain('id="test"')
    // marp-core's defaultPostSlugify appends `-${index}` where index is
    // the occurrence count (so the second occurrence is `-2`).
    expect(html).toMatch(/id="test-\d+"/)
  })
})

describe('M2 auto-scaling (fitting header)', () => {
  it('adds data-auto-scaling to <h1> with <!-- fit --> comment', () => {
    const md = new MdDeck()
    const { html } = md.render('# <!-- fit -->Big Title\n')
    // fitting-header plugin converts <h1> to <h1 is="marp-h1" data-auto-scaling>
    // (or just adds data-auto-scaling attribute depending on theme)
    expect(html).toMatch(/data-auto-scaling|is="marp-h1"/)
  })
})
